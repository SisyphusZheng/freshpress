# Still can not be used in production, but it is a good start.
# @freshpress/plugin-ssg

A [Fresh](https://fresh.deno.dev) plugin for FreshPress that enables static site generation.

## Features

- Hooks into the Fresh build process.
- After the build is complete, it copies all prerendered pages and static assets into a final output directory.
- Simple, zero-config setup for most use cases.

## Installation

Add this plugin to your `deno.json` file:

```json
{
  "imports": {
    "@freshpress/plugin-ssg": "jsr:@freshpress/plugin-ssg@^0.1.1"
  }
}
```

## Usage

In your `dev.ts` file, import and use the `ssgPlugin`. It should typically be one of the last plugins you register.

This plugin works by listening for routes that have been added for prerendering by other parts of your application or other plugins (like `@freshpress/plugin-markdown`).

```typescript
// dev.ts
import { defineConfig } from "$fresh/server.ts";
import { Builder } from "fresh/dev";
import { markdownPlugin } from "@freshpress/plugin-markdown";
import { ssgPlugin } from "@freshpress/plugin-ssg";

const builder = new Builder();

// Add other plugins that register routes first
markdownPlugin(builder, { contentDir: "./posts" });

// Add the SSG plugin
ssgPlugin(builder, {
  outputDir: "_site", // Optional: The directory for the final static site
});

const config = defineConfig({ /* ... */ });

// Run the build
if (Deno.args.includes("build")) {
  await builder.build(config);
} else {
  await builder.listen(config);
}
```

To generate your static site, run your build command (e.g., `deno task build`). The complete site will be available in the `_site` directory.