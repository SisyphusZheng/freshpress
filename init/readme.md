# Still can not be used in production, but it is a good start.

# @freshpress/init

This is the official project initializer for FreshPress, a static site generator
framework built on [Fresh](https://fresh.deno.dev).

This command-line tool scaffolds a new project with all the necessary files to
get you started, including pre-configured plugins for Markdown content and
static site generation.

## Usage

To create a new FreshPress project, run the following command from your
terminal.

### Create in a new directory

This will create a new directory named `my-docs` and generate the project files
inside it.

```sh
deno run -Ar jsr:@freshpress/init my-docs
```

### Create in the current directory

To generate the project in the current directory, use `.`:

```sh
deno run -Ar jsr:@freshpress/init .
```

## What's Included?

The generated project comes with:

- A basic Fresh application structure.
- The `@freshpress/plugin-markdown` plugin, pre-configured to read from the
  `/posts` directory.
- The `@freshpress/plugin-ssg` plugin, set up to build your project into a
  `/_site` directory.
- Pre-configured Deno tasks for development (`deno task dev`) and building
  (`deno task build`).
- An example Markdown post and the corresponding route to display it.

After initialization, just `cd` into your project directory and run
`deno task dev` to start the local development server.
