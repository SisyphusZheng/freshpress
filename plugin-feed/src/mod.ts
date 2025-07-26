import type { Builder } from "$fresh/dev.ts"; // Builder 类型
import { Rss } from "jsr:@feed/feed"; // RSS 生成库
import type {
  OnTransformOptions,
  TransformFn,
} from "$fresh/dev/file_transformer.ts"; // 转换选项类型

// 插件选项类型
export interface RssPluginOptions {
  exclude?: RegExp[]; // 排除文件
  siteTitle?: string; // 站点标题
  siteLink?: string; // 站点链接
  dataPath?: string; // 数据源路径，默认 "./data/posts.json"
}

// 加载文章数据
async function loadPosts(
  dataPath: string = "./data/posts.json",
): Promise<
  {
    title: string;
    link: string;
    description: string;
    published: Date;
    content?: string;
  }[]
> {
  try {
    const data = await Deno.readTextFile(dataPath);
    return JSON.parse(data).map((post: { published: string }) => ({
      ...post,
      published: new Date(post.published),
    }));
  } catch (e) {
    console.error("Failed to load posts:", e);
    return [];
  }
}

// 生成 RSS XML
async function generateRssXml(options: RssPluginOptions): Promise<string> {
  const posts = await loadPosts(options.dataPath);
  const rssFeed = new Rss({
    title: options.siteTitle ?? "My Fresh Feed",
    description: "Fresh site updates",
    link: `${options.siteLink ?? "https://your-site.com"}/rss.xml`,
    id: options.siteLink ?? "https://your-site.com",
    authors: [{ name: "Your Name", email: "you@example.com" }],
    updated: new Date(),
  });

  posts.forEach((post) => {
    rssFeed.addItem({
      title: post.title,
      link: post.link,
      id: post.link,
      updated: post.published,
      description: post.description,
      content: { body: post.content || post.description, type: "html" },
    });
  });

  return rssFeed.build();
}

// 插件函数（参考 Tailwind 风格）
export function rssFeed(
  builder: Builder,
  options: RssPluginOptions = {},
): void {
  const transformOptions: OnTransformOptions = {
    pluginName: "rss_feed",
    filter: /rss\.placeholder$/, // 匹配 static/rss.placeholder
    exclude: options.exclude,
  };

  const callback: TransformFn = async () => {
    const xml = await generateRssXml(options);
    return {
      content: xml,
      map: undefined,
    };
  };

  builder.onTransformStaticFile(transformOptions, callback);
}
