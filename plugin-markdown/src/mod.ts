import type { Builder } from "fresh/dev";
import { render, CSS } from "gfm";
import * as path from "@std/path";
import { expandGlob } from "@std/fs/expand-glob";

export interface MarkdownPluginOptions {
  /** The directory where your Markdown files are located. Defaults to `./posts`. */
  contentDir?: string;
}

export function markdownPlugin(
  builder: Builder,
  options: MarkdownPluginOptions = {}
): void {
  const { contentDir = "./posts" } = options;
  const postsDir = path.resolve(Deno.cwd(), contentDir);

  builder.onTransformStaticFile(
    {
      pluginName: "freshpress-markdown",
      filter: /\.md$/,
    },
    async (args) => {
      const markdown = args.text;
      const body = render(markdown);

      const html = `<!DOCTYPE html>
<html>
<head>
  <style>${CSS}</style>
</head>
<body>
  <main class="markdown-body p-4" data-color-mode="light" data-light-theme="light" data-dark-theme="dark">
    ${body}
  </main>
</body>
</html>`;

      return { content: html };
    }
  );

  console.log(`[markdown] Plugin initialized for ${contentDir}`);
}
