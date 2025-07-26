import type { Builder } from "fresh/dev"; // Builder 类型

// 插件选项类型
export interface RssPluginOptions {
  exclude?: RegExp[]; // 排除文件
  siteTitle?: string; // 站点标题
  siteLink?: string; // 站点链接
  dataPath?: string; // 数据源路径，默认 "./data/posts.json"
  language?: string; // 新增：语言，参考仓库
  copyright?: string; // 新增：版权，参考仓库
  managingEditor?: string; // 新增：编辑，参考仓库
}

// 加载文章数据
async function loadPosts(dataPath: string = "./data/posts.json"): Promise<
  {
    title: string;
    link: string;
    description: string;
    published: Date;
    content?: string;
    author?: { name: string; email: string }; // 新增：作者，支持参考仓库 Item
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

// XML 转义函数
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 生成 RSS XML（手动拼接，无依赖，参考仓库的 Rss 类实现：添加更多字段如 language, copyright, author 支持）
async function generateRssXml(options: RssPluginOptions): Promise<string> {
  const posts = await loadPosts(options.dataPath);
  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(options.siteTitle ?? "My Fresh Feed")}</title>
    <description>Fresh site updates</description>
    <link>${escapeXml(options.siteLink ?? "https://your-site.com")}</link>
    <atom:link href="${
    escapeXml(
      options.siteLink ?? "https://your-site.com",
    )
  }/rss.xml" rel="self" type="application/rss+xml" />
    <language>${options.language ?? "en-us"}</language>
    <copyright>${
    escapeXml(
      options.copyright ?? "All rights reserved",
    )
  }</copyright>
    <managingEditor>${
    escapeXml(
      options.managingEditor ?? "editor@example.com (Editor)",
    )
  }</managingEditor>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

  posts.forEach((post) => {
    xml += `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(post.link)}</link>
      <guid isPermaLink="true">${escapeXml(post.link)}</guid>
      <pubDate>${post.published.toUTCString()}</pubDate>
      <description><![CDATA[${post.description}]]></description>
      ${
      post.content
        ? `<content:encoded><![CDATA[${post.content}]]></content:encoded>`
        : ""
    }
      ${
      post.author
        ? `<author>${escapeXml(post.author.email ?? "")} (${
          escapeXml(
            post.author.name ?? "",
          )
        })</author>`
        : ""
    }
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return xml;
}

// 插件函数（参考 Tailwind 风格）
export function rssFeed(
  builder: Builder,
  options: RssPluginOptions = {},
): void {
  const transformOptions = {
    pluginName: "rss_feed",
    filter: /rss\.placeholder$/, // 匹配 static/rss.placeholder
    exclude: options.exclude,
  };

  const callback = async () => {
    const xml = await generateRssXml(options);
    return {
      content: xml,
      map: undefined,
    };
  };

  builder.onTransformStaticFile(transformOptions, callback);
}
