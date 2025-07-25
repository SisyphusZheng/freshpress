#!/usr/bin/env -S deno run -A

import { Command } from "cliffy/command/mod.ts";
import { initProject, HELP_TEXT } from "./src/init.ts";
import { devCommand } from "./src/dev.ts";
import { buildCommand } from "./src/build.ts";
import { VERSION } from "./version.ts";
import { parseArgs } from "jsr:/@std/cli@^1.0.19/parse-args";

const initCommand = new Command()
  .description("Initialize a new FreshPress project.")
  .arguments("[dir:string]")
  .option("-f, --force", "Overwrite existing files.")
  .action(async ({ force }, dir = ".") => {
    const flags = parseArgs(Deno.args, {
      boolean: ["force", "tailwind", "vscode", "docker", "help"],
      default: {
        force: force,
        tailwind: null,
        vscode: null,
        docker: null,
      },
      alias: {
        help: "h",
      },
    });

    if (flags.help) {
      console.log(HELP_TEXT);
      return;
    }

    await initProject(Deno.cwd(), [dir], flags);
  });

if (import.meta.main) {
  await new Command()
    .name("freshpress")
    .version(VERSION)
    .description("FreshPress - Fresh-based SSG framework")
    .action(() => {
      console.log("📚 FreshPress - Fresh-based SSG framework");
      console.log("Use --help to see available commands");
    })
    .command("init", initCommand)
    .command("dev", devCommand)
    .command("build", buildCommand)
    .parse(Deno.args);
}
    .command("dev", devCommand)
    .command("build", buildCommand)
    .parse(Deno.args);
}
