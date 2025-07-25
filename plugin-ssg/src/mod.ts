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
  const { outputDir = "_fresh/site" } = options;
  const outputDirPath = path.resolve(Deno.cwd(), outputDir);

  console.log("🏗️  Starting static site generation...");

  await emptyDir(outputDirPath);

  const buildDir = path.join(Deno.cwd(), "_fresh", "static");
  try {
    await copy(buildDir, outputDirPath, { overwrite: true });
    console.log("📂 Copied build output.");
  } catch (err) {
    console.warn(
      "Warning: Could not copy build output:",
      (err as Error).message
    );
  }

  const staticDir = path.join(Deno.cwd(), "static");
  try {
    await copy(staticDir, path.join(outputDirPath, "static"), {
      overwrite: true,
    });
    console.log("📂 Copied static assets.");
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.warn(
        "Warning: Could not copy static assets:",
        (err as Error).message
      );
    }
  }

  console.log("✅ Static site generation completed!");
}
