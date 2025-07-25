import type { Builder } from "fresh/dev";
import * as path from "@std/path";
import { copy } from "@std/fs";
import { emptyDir } from "@std/fs";

export interface SSGPluginOptions {
  /**
   * A function that returns an array of dynamic routes to pre-render.
   * This is necessary for routes with parameters, e.g., /posts/[slug].
   * @example
   * ```ts
   * dynamicRoutes: async () => {
   *   const posts = await listPosts(); // Fetch your data
   *   return posts.map(post => `/posts/${post.slug}`);
   * }
   * ```
   */
  dynamicRoutes?: () => Promise<string[]> | string[];
  /** The output directory for the static site. Defaults to `_site`. */
  outputDir?: string;
  /** The base URL of the site. Defaults to `http://localhost`. */
  baseUrl?: string;
}

export function ssgPlugin(
  builder: Builder,
  options: SSGPluginOptions = {}
): void {
  const { outputDir = "_fresh/site", baseUrl = "http://localhost" } = options;

  builder.onBuild("ssg-generation", async () => {
    const outputDirPath = path.resolve(Deno.cwd(), outputDir);

    console.log("🏗️  Starting static site generation...");

    // 1. Ensure the output directory is clean
    await emptyDir(outputDirPath);

    // 2. Discover all routes to render
    const routesToRender = await discoverRoutes(
      builder.config.manifest,
      options.dynamicRoutes
    );
    console.log(`Discovered ${routesToRender.size} routes to pre-render.`);

    // 3. Render each route and save to a file
    for (const route of routesToRender) {
      const url = new URL(route, baseUrl);
      const request = new Request(url);

      // 使用 builder 的渲染方法
      try {
        const response = await builder.render(request);

        if (
          response.status === 200 &&
          response.headers.get("content-type")?.includes("text/html")
        ) {
          const html = await response.text();
          await saveFile(outputDirPath, route, html);
        } else {
          console.warn(
            `Skipping ${route} (status: ${
              response.status
            }, content-type: ${response.headers.get("content-type")})`
          );
        }
      } catch (error) {
        console.warn(`Failed to render ${route}:`, error);
      }
    }

    // 4. Copy static assets
    const staticDir = path.join(Deno.cwd(), "static");
    try {
      await copy(staticDir, path.join(outputDirPath), { overwrite: true });
      console.log("📂 Copied static assets.");
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        // Ignore if static directory doesn't exist
      } else {
        throw err;
      }
    }

    console.log("✅ Static site generation completed!");
    console.log(`Your static site is ready in the '${outputDir}' directory.`);
  });
}

async function discoverRoutes(
  manifest: any, // 暂时使用 any，避免类型问题
  dynamicRoutesFn?: () => Promise<string[]> | string[]
): Promise<Set<string>> {
  const routes = new Set<string>();

  // Add static routes from the manifest
  if (manifest && manifest.routes) {
    for (const routePath in manifest.routes) {
      // Filter out API routes and middleware
      if (routePath.startsWith("/api/")) {
        continue;
      }
      routes.add(routePath);
    }
  }

  // Add dynamic routes if provided
  if (dynamicRoutesFn) {
    const dynamic = await dynamicRoutesFn();
    for (const route of dynamic) {
      routes.add(route);
    }
  }

  return routes;
}

async function saveFile(outputDir: string, route: string, content: string) {
  let filePath = path.join(outputDir, route);
  if (route.endsWith("/")) {
    filePath = path.join(filePath, "index.html");
  } else if (!filePath.endsWith(".html")) {
    filePath += ".html";
  }

  const dir = path.dirname(filePath);
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(filePath, content);
  console.log(`📄 Saved ${route} to ${path.relative(Deno.cwd(), filePath)}`);
}
