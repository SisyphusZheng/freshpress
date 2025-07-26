# Still can not be used in production, but it is a good start.

# @freshpress/plugin-markdown

A [Fresh](https://fresh.deno.dev) plugin for FreshPress that handles
Markdown-based content.

## Features

- Scans a directory for `.md` files.
- Automatically registers each Markdown file as a prerenderable route for static
  site generation.
- Exports a `loadPost` function to easily load and render Markdown content
  within your route components.

## Installation

Add this plugin to your `deno.json` file:

```json
{
  "imports": {
    "@freshpress/plugin-markdown": "jsr:@freshpress/plugin-markdown@^0.1.1"
  }
}
```

## Usage

This plugin has two parts: the plugin itself, which you add to your `dev.ts` (or
`fresh.config.ts`), and the `loadPost` function, which you use in your route
file.

### 1. Configure the plugin

In your `dev.ts` file, import and use the `markdownPlugin`.

```typescript
// dev.ts
import { defineConfig } from "$fresh/server.ts";
import { Builder } from "fresh/dev";
import { markdownPlugin } from "@freshpress/plugin-markdown";

const builder = new Builder();

// Add the markdown plugin
markdownPlugin(builder, {
  contentDir: "./posts", // The directory where your .md files are located
});

// ... other plugins and config
const config = defineConfig({/* ... */});

if (Deno.args.includes("build")) {
  await builder.build(config);
} else {
  await builder.listen(config);
}
```

### 2. Load data in your route

In your dynamic route file (e.g., `routes/posts/[slug].tsx`), use the `loadPost`
function to get the content for the page.

```tsx
// routes/posts/[slug].tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { loadPost, Post } from "@freshpress/plugin-markdown";

export const handler: Handlers<Post> = {
  async GET(_req, ctx) {
    // The slug is taken from the URL
    const post = await loadPost(ctx.params.slug, { contentDir: "./posts" });
    if (!post) {
      return ctx.renderNotFound();
    }
    return ctx.render(post);
  },
};

export default function PostPage({ data }: PageProps<Post>) {
  return (
    <>
      <Head>
        <title>{data.title}</title>
      </Head>
      <article
        class="markdown-body"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </>
  );
}
```
