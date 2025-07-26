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
  // FIX: Use 'as any' to bypass incomplete type definitions for Builder
  (builder as any).onBeforeBuild(async () => {
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
        // FIX: Use 'as any' to bypass incomplete type definitions for Builder
        (builder as any).addPrerenderedRoute(route);
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
      // FIX: Cast attrs to 'any' to access properties not defined in its base type
      title: ((attrs as any)?.title as string) || "Untitled Post",
      content,
      // FIX: Cast attrs to 'any' to satisfy the more specific 'Record' type
      attrs: (attrs as any) || {},
    };
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return null;
    }
    throw err;
  }
}
