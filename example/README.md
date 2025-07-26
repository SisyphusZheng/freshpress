# FreshPress Project

Welcome to your new FreshPress documentation site with **Tailwind CSS** and
**daisyUI**!

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

```bash
deno task dev
```

This will watch the project directory and restart as necessary.

Your documentation content is located in the `posts/` directory. An example
article is available at `posts/getting-started.md`. You can view it at
http://localhost:8000/posts/getting-started.

To create a new article, add a new .md file in the `posts/` directory with
optional frontmatter (e.g., title). The filename will be used as the slug.

### Building

Run `deno task build` to generate static files for deployment.

### daisyUI Components

You can use daisyUI components throughout your site:

- Buttons: `btn btn-primary`, `btn btn-secondary`
- Cards: `card bg-base-100 shadow-xl`
- Alerts: `alert alert-success`
- Navigation: `navbar`, `menu`

For more components, visit: https://daisyui.com/
