import type { Builder } from "fresh/dev";
import { extract } from "@std/front-matter/yaml";
import { render } from "gfm";
import * as path from "@std/path";
import { expandGlob } from "@std/fs/expand-glob";

export interface Post {
  slug: string;
  title: string;
  content: string; // The HTML content
  attrs: Record<string, unknown>;
}

export interface MarkdownOptions {
  contentDir?: string;
  routeBasePath?: string;
}

/**
 * A Fresh plugin that discovers markdown files and adds them as prerenderable routes.
 */
export function markdownPlugin(
  builder: Builder,
  options: MarkdownOptions = {}
): void {
  builder.onBeforeBuild(async () => {
    const { contentDir = "./posts" } = options;
    const postsDir = path.resolve(Deno.cwd(), contentDir);
    const routeBasePath = options.routeBasePath ?? path.basename(postsDir);
    const globPattern = path.join(postsDir, "**/*.md");

    console.log("[markdown] Discovering posts...");
    let count = 0;
    for await (const file of expandGlob(globPattern)) {
      if (file.isFile) {
        const slug = path.relative(postsDir, file.path).replace(/\.md$/, "");
        const route = `/${routeBasePath}/${slug}`;
        builder.addPrerenderedRoute(route);
        count++;
      }
    }
    console.log(`[markdown] Added ${count} post routes for prerendering.`);
  });
}

/**
 * Loads a single post from a markdown file.
 * This is used by the route component to get the data for a specific page.
 */
export async function loadPost(
  slug: string,
  options: MarkdownOptions = {}
): Promise<Post | null> {
  const { contentDir = "./posts" } = options;
  const postsDir = path.resolve(Deno.cwd(), contentDir);
  const filePath = path.join(postsDir, `${slug}.md`);

  try {
    const fileContent = await Deno.readTextFile(filePath);
    const { attrs, body } = extract(fileContent);
    const content = render(body);

    return {
      slug,
      title: (attrs?.title as string) || "Untitled Post",
      content,
      attrs: attrs || {},
    };
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return null;
    }
    throw err;
  }
}
