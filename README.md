# FreshPress

> A Static Site Generator + Hybrid Rendering Documentation Framework for Fresh

FreshPress is a modern documentation framework built entirely on [Fresh](https://fresh.deno.dev). Through a plugin-based architecture, it provides features like Static Site Generation (SSG), search, and Markdown support, all while preserving the advantages of Fresh's island architecture.

## 🚀 Features

- 🏝️ **Island Architecture**: Built on Fresh, zero client-side JavaScript, with on-demand hydration.
- 📝 **Markdown Support**: Powerful Markdown processing capabilities via a dedicated plugin.
- ⚡ **Performance Optimized**: Static generation + on-demand rendering.
- 🧩 **Pluggable**: Extensible plugin ecosystem.

## 🗺️ Roadmap

We are actively working on expanding the FreshPress ecosystem. Here are some of the features and plugins planned for future releases:

- **Sitemap Generation**: Automatic `sitemap.xml` generation for better SEO.
- **`@freshpress/plugin-search`**: A dependency-free, client-side full-text search plugin.
- **`@freshpress/plugin-i18n`**: A plugin for multi-language content routing and internationalization.

## 📦 Package Structure

This is a monorepo project containing the following core packages:

- [`@freshpress/init`](./init) - A command-line tool to scaffold a new FreshPress project.
- [`@freshpress/plugin-ssg`](./plugin-ssg) - A plugin for Static Site Generation (SSG).
- [`@freshpress/plugin-markdown`](./plugin-md) - A plugin to render Markdown content as pages.

## 🏁 Quick Start

```bash
# Create a new project
deno run -A jsr:@freshpress/init my-docs

# Change into the project directory
cd my-docs

# Start the development server
deno task dev

# Build the project for production
deno task build
```

## 📖 Documentation

The official documentation is under development.

## 🤝 Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md).

## 📄 License

MIT License - See the [LICENSE](LICENSE) file