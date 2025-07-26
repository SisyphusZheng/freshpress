import type { Builder } from "fresh/dev";
import { extract } from "@std/front-matter/yaml";
import { render } from "gfm";
import * as path from "@std/path";
import { expandGlob } from "@std/fs/expand-glob";

export interface Post {
  slug: string;
  title: string;
  content: string;
  attrs: Record<string, unknown>;
}

export interface MarkdownOptions {
  contentDir?: string;
  routeBasePath?: string;
}

/**
 * Fresh v2 Markdown 插件 - 只提供数据加载功能
 * 不能依赖Builder的钩子，因为它们不存在
 */
export function markdownPlugin(
  builder: Builder,
  options: MarkdownOptions = {}
): void {
  // Builder 没有钩子，这个插件主要提供工具函数
  console.log("[markdown] Plugin loaded, providing utility functions");
}

/**
 * 加载单个文章
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
      title: ((attrs as any)?.title as string) || "Untitled Post",
      content,
      attrs: (attrs as any) || {},
    };
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return null;
    }
    throw err;
  }
}

/**
 * 获取所有文章
 */
export async function getAllPosts(contentDir = "./posts"): Promise<Post[]> {
  const postsDir = path.resolve(Deno.cwd(), contentDir);
  const globPattern = path.join(postsDir, "**/*.md");
  const posts: Post[] = [];

  try {
    for await (const file of expandGlob(globPattern)) {
      if (file.isFile) {
        const slug = path.relative(postsDir, file.path).replace(/\.md$/, "");
        const post = await loadPost(slug, { contentDir });
        if (post) {
          posts.push(post);
        }
      }
    }
  } catch (error) {
    console.warn(
      `Warning: Could not scan directory ${contentDir}:`,
      (error as Error).message
    );
  }

  return posts.sort((a, b) => {
    const dateA = (a.attrs.date as string) || "1970-01-01";
    const dateB = (b.attrs.date as string) || "1970-01-01";
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}
