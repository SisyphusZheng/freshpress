import type { Builder } from "fresh/dev";
import * as path from "@std/path";
import { copy } from "@std/fs/copy";
import { emptyDir } from "@std/fs/empty-dir";

export interface SSGOptions {
  outputDir?: string;
  staticDir?: string;
  copyAssets?: boolean;
}

// 全局标记，避免重复执行
let ssgExecuted = false;

/**
 * Fresh v2 SSG 插件 - 使用文件转换器来处理构建后的复制
 */
export function ssgPlugin(builder: Builder, options: SSGOptions = {}): void {
  const outputDir = path.resolve(Deno.cwd(), options.outputDir || "_site");
  const staticDir = path.resolve(Deno.cwd(), options.staticDir || "static");
  const copyAssets = options.copyAssets !== false;

  builder.onTransformStaticFile(async (file) => {
    // 只在第一次触发时执行SSG
    if (!ssgExecuted) {
      ssgExecuted = true;
      await executeSSG(outputDir, staticDir, copyAssets, builder.config.outDir);
    }
    return file; // 不修改文件内容
  });

  async function executeSSG(
    outputDir: string,
    staticDir: string,
    copyAssets: boolean,
    freshOutDir: string
  ): Promise<void> {
    console.log("🏗️  Starting static site generation...");

    // 1. 清空输出目录
    try {
      await emptyDir(outputDir);
      console.log("🗑️  Cleaned output directory");
    } catch (error) {
      console.warn(
        "Warning: Could not clean output directory:",
        (error as Error).message
      );
    }

    // 2. 复制Fresh构建的静态文件
    try {
      await copy(freshOutDir, outputDir, { overwrite: true });
      console.log("📂 Copied Fresh build output");
    } catch (err) {
      console.warn(
        "Warning: Could not copy Fresh build output:",
        (err as Error).message
      );
    }

    // 3. 复制静态资源
    if (copyAssets) {
      try {
        await copy(staticDir, outputDir, { overwrite: true });
        console.log("📂 Copied static assets");
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          console.warn(
            "Warning: Could not copy static assets:",
            (err as Error).message
          );
        }
      }
    }

    console.log(
      `✅ Static site generation completed! Output in ${path.basename(
        outputDir
      )}`
    );
  }
}
