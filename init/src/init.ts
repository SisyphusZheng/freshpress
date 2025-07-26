// deno-lint-ignore-file no-console
import * as colors from "@std/fmt/colors";
import * as path from "@std/path";
import { CSS as GFM_CSS, render } from "@deno/gfm";

// Keep these as is, as we replace these version in our release script
const FRESH_VERSION = "2.0.0-alpha.45";
const FRESH_TAILWIND_VERSION = "0.0.1-alpha.9";
const PREACT_VERSION = "10.26.9";
const PREACT_SIGNALS_VERSION = "2.2.1";
const TAILWINDCSS_VERSION = "4.1.10";
const TAILWINDCSS_POSTCSS_VERSION = "4.1.10";
const POSTCSS_VERSION = "8.5.6";

function css(strs: TemplateStringsArray, ...exprs: string[]): string {
  let out = "";

  for (let i = 0; i < exprs.length; i++) {
    out += strs[i];
    out += String(exprs[i]);
  }
  out += strs.at(-1) ?? "";

  return out;
}

export class InitError extends Error {}

function error(message: string): never {
  console.error(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
  throw new InitError();
}

export const HELP_TEXT = `@freshpress/init

Initialize a new FreshPress project. This will create all the necessary files for a
new documentation site with Tailwind CSS and daisyUI.

To generate a project in the './my-docs' subdirectory:
  deno run -Ar jsr:@freshpress/init ./my-docs

To generate a project in the current directory:
  deno run -Ar jsr:@freshpress/init .

USAGE:
    deno run -Ar jsr:@freshpress/init [DIRECTORY]

OPTIONS:
    --force      Overwrite existing files
`;

export const CONFIRM_EMPTY_MESSAGE =
  "The target directory is not empty (files could get overwritten). Do you want to continue anyway?";

export async function initProject(
  cwd = Deno.cwd(),
  input: (string | number)[],
  flags: {
    docker?: boolean | null;
    force?: boolean | null;
    tailwind?: boolean | null;
    vscode?: boolean | null;
  } = {}
): Promise<void> {
  console.log();
  console.log(
    colors.bgRgb8(
      colors.rgb8(" 📚 FreshPress: The SSG framework with Tailwind CSS & daisyUI ", 0),
      121
    )
  );
  console.log();

  let unresolvedDirectory = Deno.args[0];
  if (input.length !== 1) {
    const userInput = prompt("Project Name:", "freshpress-project");
    if (!userInput) {
      error(HELP_TEXT);
    }

    unresolvedDirectory = userInput;
  }

  const projectDir = path.resolve(cwd, unresolvedDirectory);

  try {
    const dir = [...Deno.readDirSync(projectDir)];
    const isEmpty =
      dir.length === 0 || (dir.length === 1 && dir[0].name === ".git");
    if (
      !isEmpty &&
      !(flags.force === null ? confirm(CONFIRM_EMPTY_MESSAGE) : flags.force)
    ) {
      error("Directory is not empty.");
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  const useDocker = flags.docker;
  const useTailwind = true;
  const useVSCode = true;

  const writeFile = async (
    pathname: string,
    content:
      | string
      | Uint8Array
      | ReadableStream<Uint8Array>
      | Record<string, unknown>
  ) => await writeProjectFile(projectDir, pathname, content);

  const GITIGNORE = `# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# Fresh build directory
_fresh/
# npm + other dependencies
node_modules/
vendor/
`;

  await writeFile(".gitignore", GITIGNORE);

  if (useDocker) {
    const DENO_VERSION = Deno.version.deno;
    const DOCKERFILE_TEXT = `
FROM denoland/deno:${DENO_VERSION}

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=\${GIT_REVISION}

WORKDIR /app

COPY . .
RUN deno cache _fresh/server.js

EXPOSE 8000

CMD ["serve", "-A", "_fresh/server.js"]

`;
    await writeFile("Dockerfile", DOCKERFILE_TEXT);
  }

  // deno-fmt-ignore
  const GRADIENT_CSS = css`
    .fresh-gradient {
      background-color: rgb(134, 239, 172);
      background-image: linear-gradient(
        to right bottom,
        rgb(219, 234, 254),
        rgb(187, 247, 208),
        rgb(254, 249, 195)
      );
    }
  `;

  const TAILWIND_CSS = css`
    @import "tailwindcss";
    @plugin "daisyui";
    ${GRADIENT_CSS}
  `;

  await writeFile("static/styles.css", TAILWIND_CSS);

  // deno-fmt-ignore
  const STATIC_LOGO = `<svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M34.092 8.845C38.929 20.652 34.092 27 30 30.5c1 3.5-2.986 4.222-4.5 2.5-4.457 1.537-13.512 1.487-20-5C2 24.5 4.73 16.714 14 11.5c8-4.5 16-7 20.092-2.655Z"
    fill="#FFDB1E"
  />
  <path
    d="M14 11.5c6.848-4.497 15.025-6.38 18.368-3.47C37.5 12.5 21.5 22.612 15.5 25c-6.5 2.587-3 8.5-6.5 8.5-3 0-2.5-4-5.183-7.75C2.232 23.535 6.16 16.648 14 11.5Z"
    fill="#fff"
    stroke="#FFDB1E"
  />
  <path
    d="M28.535 8.772c4.645 1.25-.365 5.695-4.303 8.536-3.732 2.692-6.606 4.21-7.923 4.83-.366.173-1.617-2.252-1.617-1 0 .417-.7 2.238-.934 2.326-1.365.512-4.223 1.29-5.835 1.29-3.491 0-1.923-4.754 3.014-9.122.892-.789 1.478-.645 2.283-.645-.537-.773-.534-.917.403-1.546C17.79 10.64 23 8.77 25.212 8.42c.366.014.82.35.82.629.41-.14 2.095-.388 2.503-.278Z"
    fill="#FFE600"
  />
  <path
    d="M14.297 16.49c.985-.747 1.644-1.01 2.099-2.526.566.121.841-.08 1.29-.701.324.466 1.657.608 2.453.701-.715.451-1.057.852-1.452 2.106-1.464-.611-3.167-.302-4.39.42Z"
    fill="#fff"
  />
</svg>`;
  await writeFile("static/logo.svg", STATIC_LOGO);
  await writeFile("static/gfm.css", GFM_CSS);
  try {
    const res = await fetch("https://fresh.deno.dev/favicon.ico");
    const buf = await res.arrayBuffer();
    await writeFile("static/favicon.ico", new Uint8Array(buf));
  } catch {
    // Skip this and be silent if there is a network issue.
  }

  const MAIN_TS = `import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();`;
  await writeFile("main.ts", MAIN_TS);

  const UTILS_TS = `import { createDefine } from "fresh";

// deno-lint-ignore no-empty-interface
export interface State {}

export const define = createDefine<State>();`;
  await writeFile("utils.ts", UTILS_TS);

  const ROUTES_HOME = `import { define } from "../utils.ts";

export default define.page(function Home() {
  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo.svg"
            width="128"
            height="128"
            alt="the FreshPress logo"
          />
          <h1 class="text-4xl font-bold text-primary mb-4">Welcome to FreshPress</h1>
          <p class="text-lg text-base-content/70 mb-8 text-center">
            Your new documentation site with Tailwind CSS and daisyUI is ready.
          </p>
          <a href="/posts/getting-started" class="btn btn-primary">
            Get started
          </a>
        </div>
      </div>
    </div>
  );
});`;
  await writeFile("routes/index.tsx", ROUTES_HOME);

  // 修改 APP_WRAPPER，添加 gfm.css 并使用 daisyUI 主题
  const APP_WRAPPER = `import type { PageProps } from "fresh";

export default function App({ Component }: PageProps) {
  return (
    <html data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${path.basename(projectDir)}</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/gfm.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}`;
  await writeFile("routes/_app.tsx", APP_WRAPPER);

  const API_NAME = `import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const name = ctx.params.name;
    return new Response(
      \`Hello, \${name.charAt(0).toUpperCase() + name.slice(1)}!\`,
    );
  },
});`;
  await writeFile("routes/api/[name].tsx", API_NAME);

  const GETTING_STARTED_MD = `---
title: Getting Started
desc: Welcome to your new FreshPress documentation site
---

# Getting Started

Welcome to your new FreshPress documentation site with **Tailwind CSS** and **daisyUI**!

This page is located at \`posts/getting-started.md\`.

## What's Included

- ✅ **Fresh** - Modern web framework for Deno
- ✅ **Tailwind CSS** - Utility-first CSS framework
- ✅ **daisyUI** - Semantic component classes for Tailwind CSS
- ✅ **Markdown Support** - Write content in Markdown
- ✅ **Static Site Generation** - Deploy anywhere

## Quick Start

1. Create new Markdown files in the \`posts/\` directory
2. Run \`deno task dev\` for development
3. Run \`deno task build\` to generate static files

## daisyUI Components

You can now use daisyUI components in your pages:

- Buttons: \`btn btn-primary\`
- Cards: \`card bg-base-100 shadow-xl\`
- Alerts: \`alert alert-success\`

Happy building! 🦕
`;
  await writeFile("posts/getting-started.md", GETTING_STARTED_MD);

  // 修复导入路径，删除 POSTS_LAYOUT
  const SLUG_TSX = `import { Handlers, PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { loadPost, Post } from "@freshpress/plugin-markdown";

export const handler: Handlers<Post> = {
  async GET(_req, ctx) {
    const post = await loadPost(ctx.params.slug);
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
      <div class="min-h-screen bg-base-100">
        <div class="container mx-auto px-4 py-8">
          <div class="max-w-screen-md mx-auto">
            <article
              class="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          </div>
        </div>
      </div>
    </>
  );
}`;
  await writeFile("routes/posts/[slug].tsx", SLUG_TSX);

  // 修复 DEV_TS 导入路径
  const DEV_TS = `#!/usr/bin/env -S deno run -A --watch=static/,routes/,posts/
import { defineConfig } from "fresh";
import { Builder } from "fresh/dev";

import tailwind from "@fresh/plugin-tailwind";
import { markdownPlugin } from "@freshpress/plugin-markdown";
import { ssgPlugin } from "@freshpress/plugin-ssg";

const builder = new Builder();

// Configure Tailwind CSS
tailwind(builder);

// Configure FreshPress Markdown to discover and add post routes
markdownPlugin(builder, { contentDir: "./posts" });

// Configure FreshPress SSG to copy files after build
ssgPlugin(builder);

const config = defineConfig({});

if (Deno.args.includes("build")) {
  await builder.build(config);
} else {
  await builder.listen(config);
}`;
  await writeFile("dev.ts", DEV_TS);

  const denoJson = {
    nodeModulesDir: "auto",
    tasks: {
      check: "deno fmt --check . && deno lint . && deno check",
      dev: "deno run -A --watch=static/,routes/,posts/ dev.ts",
      build: "deno run -A dev.ts build",
      start: "deno serve -A _fresh/server.js",
      update: "deno run -A -r jsr:@fresh/update .",
    },
    lint: {
      rules: {
        tags: ["fresh", "recommended"],
      },
    },
    exclude: ["**/_fresh/*"],
    imports: {
      fresh: `jsr:@fresh/core@^${FRESH_VERSION}`,
      preact: `npm:preact@^${PREACT_VERSION}`,
      "@preact/signals": `npm:@preact/signals@^${PREACT_SIGNALS_VERSION}`,
      "@freshpress/plugin-ssg": `jsr:@freshpress/plugin-ssg@latest`,
      "@freshpress/plugin-markdown": `jsr:@freshpress/plugin-markdown@latest`,
      "@deno/gfm": "jsr:@deno/gfm@0.11.0",
      "@std/front-matter": "jsr:@std/front-matter@0.2.0",
      "@std/path": "jsr:@std/path@1",
      "@std/fs/expand-glob": "jsr:@std/fs@^1.0.0-rc.8/expand-glob",
      "tailwindcss": `npm:tailwindcss@^${TAILWINDCSS_VERSION}`,
      "@fresh/plugin-tailwind": `jsr:@fresh/plugin-tailwind@^${FRESH_TAILWIND_VERSION}`,
      "@tailwindcss/postcss": `npm:@tailwindcss/postcss@^${TAILWINDCSS_POSTCSS_VERSION}`,
      postcss: `npm:postcss@^${POSTCSS_VERSION}`,
      daisyui: `npm:daisyui@latest`,
    } as Record<string, string>,
    compilerOptions: {
      lib: ["dom", "dom.asynciterable", "dom.iterable", "deno.ns"],
      jsx: "precompile",
      jsxImportSource: "preact",
      jsxPrecompileSkipElements: ["a", "img", "source", "body", "html", "head"],
    },
  };

  await writeFile("deno.json", denoJson);

  const README_MD = `# FreshPress Project

Welcome to your new FreshPress documentation site with **Tailwind CSS** and **daisyUI**!

## Features

- 🦕 **Fresh** - Modern web framework for Deno
- 🎨 **Tailwind CSS** - Utility-first CSS framework  
- 🧩 **daisyUI** - Semantic component library
- 📝 **Markdown Support** - Write content in Markdown
- 🚀 **Static Site Generation** - Deploy anywhere

### Usage

Make sure to install Deno:
https://docs.deno.com/runtime/getting_started/installation

Then start the project in development mode:

\`\`\`bash
deno task dev
\`\`\`

This will watch the project directory and restart as necessary.

Your documentation content is located in the \`posts/\` directory. An example article is available at \`posts/getting-started.md\`. You can view it at http://localhost:8000/posts/getting-started.

To create a new article, add a new .md file in the \`posts/\` directory with optional frontmatter (e.g., title). The filename will be used as the slug.

### Building

Run \`deno task build\` to generate static files for deployment.

### daisyUI Components

You can use daisyUI components throughout your site:

- Buttons: \`btn btn-primary\`, \`btn btn-secondary\`
- Cards: \`card bg-base-100 shadow-xl\`
- Alerts: \`alert alert-success\`
- Navigation: \`navbar\`, \`menu\`

For more components, visit: https://daisyui.com/
`;
  await writeFile("README.md", README_MD);

  // VSCode 配置（强制启用）
  const vscodeSettings = {
    "deno.enable": true,
    "deno.lint": true,
    "editor.defaultFormatter": "denoland.vscode-deno",
    "[typescriptreact]": {
      "editor.defaultFormatter": "denoland.vscode-deno",
    },
    "[typescript]": {
      "editor.defaultFormatter": "denoland.vscode-deno",
    },
    "[javascriptreact]": {
      "editor.defaultFormatter": "denoland.vscode-deno",
    },
    "[javascript]": {
      "editor.defaultFormatter": "denoland.vscode-deno",
    },
    "css.customData": [".vscode/tailwind.json"],
  };

  await writeFile(".vscode/settings.json", vscodeSettings);

  const recommendations = ["denoland.vscode-deno", "bradlc.vscode-tailwindcss"];
  await writeFile(".vscode/extensions.json", { recommendations });

  const tailwindCustomData = {
    version: 1.1,
    atDirectives: [
      {
        name: "@tailwind",
        description:
          "Use the `@tailwind` directive to insert Tailwind's `base`, `components`, `utilities` and `screens` styles into your CSS.",
        references: [
          {
            name: "Tailwind Documentation",
            url: "https://tailwindcss.com/docs/functions-and-directives#tailwind",
          },
        ],
      },
      {
        name: "@plugin",
        description:
          "Use the `@plugin` directive to register plugins with Tailwind CSS.",
        references: [
          {
            name: "Tailwind Documentation",  
            url: "https://tailwindcss.com/docs/functions-and-directives#plugin",
          },
        ],
      },
      {
        name: "@apply",
        description:
          "Use the `@apply` directive to inline any existing utility classes into your own custom CSS.",
        references: [
          {
            name: "Tailwind Documentation",
            url: "https://tailwindcss.com/docs/functions-and-directives#apply",
          },
        ],
      },
    ],
  };

  await writeFile(".vscode/tailwind.json", tailwindCustomData);

  // Specifically print unresolvedDirectory, rather than resolvedDirectory in order to
  // not leak personal info (e.g. `/Users/MyName`)
  console.log("\n%cProject initialized with Tailwind CSS & daisyUI!\n", "color: green; font-weight: bold");

  if (unresolvedDirectory !== ".") {
    console.log(
      `Enter your project directory using %ccd ${unresolvedDirectory}%c.`,
      "color: cyan",
      ""
    );
  }
  console.log(
    "Run %cdeno task dev%c to start the project. %cCTRL-C%c to stop.",
    "color: cyan",
    "",
    "color: cyan",
    ""
  );
  console.log();
  console.log(
    "Documentation: %chttps://daisyui.com/%c for component reference.",
    "color: cyan",
    ""
  );
  console.log();
  console.log("%cHappy hacking with daisyUI! 🦕", "color: gray");
}

async function writeProjectFile(
  projectDir: string,
  pathname: string,
  content:
    | string
    | Uint8Array
    | ReadableStream<Uint8Array>
    | Record<string, unknown>
) {
  const filePath = path.join(
    projectDir,
    ...pathname.split("/").filter(Boolean)
  );
  try {
    await Deno.mkdir(path.dirname(filePath), { recursive: true });
    if (typeof content === "string") {
      let formatted = content;
      if (!content.endsWith("\n\n")) {
        formatted += "\n";
      }
      await Deno.writeTextFile(filePath, formatted);
    } else if (
      content instanceof Uint8Array ||
      content instanceof ReadableStream
    ) {
      await Deno.writeFile(filePath, content);
    } else {
      await Deno.writeTextFile(
        filePath,
        JSON.stringify(content, null, 2) + "\n"
      );
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }
}
