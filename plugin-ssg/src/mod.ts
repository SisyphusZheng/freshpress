import type { Builder } from "fresh/dev";
import * as path from "@std/path";
import { copy } from "@std/fs/copy";
import { emptyDir } from "@std/fs/empty-dir";

export interface SSGPluginOptions {
  outputDir?: string;
  baseUrl?: string;
}

export function ssgPlugin(
  builder: Builder,
  options: SSGPluginOptions = {}
): void {
  // The onBeforeBuild hook is no longer needed here, as markdownPlugin now handles adding routes.
  builder.onAfterBuild(async (snapshot) => {
    await generateStaticSite(snapshot.prerendered, options);
  });
}

export async function generateStaticSite(
  prerenderedRoutes: Set<string>,
  options: SSGPluginOptions = {}
) {
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
      if (prerenderedRoutes.size > 0) {
        console.warn(
          "Warning: '_fresh/prerendered' directory not found, but routes were expected."
        );
      }
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
