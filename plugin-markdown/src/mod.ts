import type { Plugin } from "fresh";
import { render, CSS } from "gfm";
import * as path from "@std/path";
import { glob } from "@std/fs/glob";
import { type VNode } from "preact";

export interface MarkdownPluginOptions {
  /** The directory where your Markdown files are located. Defaults to `./posts`. */
  contentDir?: string;
}

/**
 * A Fresh plugin that discovers Markdown files in a directory,
 * converts them to HTML at build time, and creates static routes for them.
 */
export function markdownPlugin(options: MarkdownPluginOptions = {}): Plugin {
  const { contentDir = "./posts" } = options;
  const postsDir = path.resolve(Deno.cwd(), contentDir);

  return {
    name: "freshpress-markdown",
    async routes() {
      const generatedRoutes: Plugin["routes"] = [];

      for await (const file of glob("**/*.md", {
        cwd: postsDir,
        includeDirs: false,
      })) {
        const markdown = await Deno.readTextFile(file.path);
        const body = render(markdown);

        const Component = (): VNode => (
          <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <main
              class="markdown-body p-4"
              data-color-mode="light"
              data-light-theme="light"
              data-dark-theme="dark"
            >
              <div dangerouslySetInnerHTML={{ __html: body }} />
            </main>
          </>
        );

        const routePath =
          "/" +
          path.relative(postsDir, file.path).replace(/(\/index)?\.md$/, "");

        generatedRoutes.push({
          path: routePath,
          component: Component,
        });

        console.log(`[md] Discovered and converted: ${routePath}`);
      }

      return generatedRoutes;
    },
  };
}
