import type { Builder } from "fresh/dev";
import * as path from "@std/path";
import { copy } from "@std/fs";
import { emptyDir } from "@std/fs";

export interface SSGPluginOptions {
  dynamicRoutes?: () => Promise<string[]> | string[];
  outputDir?: string;
  baseUrl?: string;
}

export function ssgPlugin(
  builder: Builder,
  options: SSGPluginOptions = {}
): void {
  const { outputDir = "_fresh/site" } = options;

  builder.onBeforeBuild(async () => {
    if (options.dynamicRoutes) {
      console.log("[ssg] Discovering dynamic routes...");
      const dynamicPaths = await options.dynamicRoutes();
      for (const path of dynamicPaths) {
        builder.addPrerenderedRoute(path);
      }
      console.log(
        `[ssg] Added ${dynamicPaths.length} dynamic routes for prerendering.`
      );
    }
  });

  builder.onTransformStaticFile(
    {
      pluginName: "freshpress-ssg",
      filter: /\.html$/,
    },
    async (args) => {
      console.log(`[ssg] Processing ${args.path}`);
      return { content: args.text };
    }
  );

  console.log(`[ssg] Plugin initialized, output dir: ${outputDir}`);
}

export async function generateStaticSite(options: SSGPluginOptions = {}) {
  const { outputDir = "_site" } = options;
  const outputDirPath = path.resolve(Deno.cwd(), outputDir);

  console.log("🏗️  Starting static site generation...");

  await emptyDir(outputDirPath);

  // 1. Copy prerendered HTML files
  const prerenderedDir = path.join(Deno.cwd(), "_fresh", "prerendered");
  try {
    await copy(prerenderedDir, outputDirPath, { overwrite: true });
    console.log("📂 Copied prerendered HTML files.");
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      console.warn(
        "Warning: '_fresh/prerendered' directory not found. No pages were prerendered."
      );
    } else {
      console.error(
        `Error: Could not copy prerendered files:`,
        (err as Error).message
      );
      return;
    }
  }

  // 2. Copy static assets (JS, CSS, etc.) from the build output
  const buildDir = path.join(Deno.cwd(), "_fresh", "static");
  try {
    await copy(buildDir, outputDirPath, { overwrite: true });
    console.log("📂 Copied build assets.");
  } catch (err) {
    console.warn(
      "Warning: Could not copy build assets:",
      (err as Error).message
    );
  }

  // 3. Copy public static assets (images, fonts, etc.)
  const staticDir = path.join(Deno.cwd(), "static");
  try {
    await copy(staticDir, outputDirPath, {
      overwrite: true,
    });
    console.log("📂 Copied public static assets.");
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.warn(
        "Warning: Could not copy static assets:",
        (err as Error).message
      );
    }
  }

  console.log(
    `✅ Static site generation completed! Output in /${path.basename(
      outputDirPath
    )}`
  );
}
