import type { Builder } from "fresh/dev";
import { render, CSS } from "gfm";
import * as path from "@std/path";
import { expandGlob } from "@std/fs/expand-glob";
import { type VNode, createElement as h } from "preact";

export interface MarkdownPluginOptions {
  /** The directory where your Markdown files are located. Defaults to `./posts`. */
  contentDir?: string;
}

/**
 * A Fresh plugin that discovers Markdown files in a directory,
 * converts them to HTML at build time, and creates static routes for them.
 */
export function markdownPlugin(
  builder: Builder,
  options: MarkdownPluginOptions = {}
): void {
  const { contentDir = "./posts" } = options;
  const postsDir = path.resolve(Deno.cwd(), contentDir);

  // 在构建时生成路由
  builder.onBuild("markdown-routes", async () => {
    const routes: Array<{ path: string; component: () => VNode }> = [];

    for await (const file of expandGlob("**/*.md", {
      root: postsDir,
      includeDirs: false,
    })) {
      const markdown = await Deno.readTextFile(file.path);
      const body = render(markdown);

      const Component = (): VNode => {
        return h("div", {}, [
          h("style", { dangerouslySetInnerHTML: { __html: CSS } }),
          h(
            "main",
            {
              class: "markdown-body p-4",
              "data-color-mode": "light",
              "data-light-theme": "light",
              "data-dark-theme": "dark",
            },
            [h("div", { dangerouslySetInnerHTML: { __html: body } })]
          ),
        ]);
      };

      const routePath =
        "/" + path.relative(postsDir, file.path).replace(/(\/index)?\.md$/, "");

      routes.push({
        path: routePath,
        component: Component,
      });

      console.log(`[md] Discovered and converted: ${routePath}`);
    }

    // 注册生成的路由
    for (const route of routes) {
      builder.addRoute(route.path, route.component);
    }
  });
}
