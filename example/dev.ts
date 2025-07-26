#!/usr/bin/env -S deno run -A --watch=static/,routes/,posts/
import { Builder } from "fresh/dev";
import { tailwind } from "@fresh/plugin-tailwind";
import { markdownPlugin } from "@freshpress/plugin-markdown";
import { ssgPlugin } from "@freshpress/plugin-ssg";
import { app } from "./main.ts";

const builder = new Builder();

// Configure Tailwind CSS
tailwind(builder);

// Configure FreshPress Markdown plugin
markdownPlugin(builder, { contentDir: "./posts" });

// Configure FreshPress SSG plugin
ssgPlugin(builder, { outputDir: "_site", staticDir: "static" });

if (Deno.args.includes("build")) {
  const apply = await builder.build();
  apply(app);
} else {
  await builder.listen(() => Promise.resolve({ app }));
}
