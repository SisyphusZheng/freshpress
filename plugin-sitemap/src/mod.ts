import { join, SEPARATOR } from "@std/path";
import { ensureFile, exists } from "@std/fs";

/**
 * Represents a single entry in the sitemap with a location and last modified date.
 */
export interface SiteMapEntry {
  /** The location (URL) of the sitemap entry */
  loc: string;
  /** The last modified date for the sitemap entry in ISO string format */
  lastmod: string;
}

/**
 * A list of sitemap entries.
 */
export type Sitemap = SiteMapEntry[];

/**
 * Options for configuring sitemap generation, including languages and default language.
 */
export interface SiteMapOptions {
  /** Array of languages supported for the sitemap entries */
  languages?: string[];
  /** The default language for the sitemap if no specific language is specified */
  defaultLanguage?: string;
}

/**
 * Configuration options for saving the sitemap and robots.txt.
 */
export interface SitemapConfig {
  /** The base URL of the website (e.g., 'https://example.com') */
  basename: string;
  /** Directory containing route files */
  distDirectory: string;
  /** Directory containing posts in markdown format */
  postsDirectory: string;
  /** Path to save the generated sitemap XML */
  sitemapPath: string;
  /** Path to save the generated robots.txt */
  robotsPath: string;
  /** Additional options for sitemap generation, including languages */
  options?: SiteMapOptions;
}

/**
 * Generates a sitemap XML string from specified directories and a base URL.
 * @param basename - The base URL of the website (e.g., 'https://example.com')
 * @param distDirectory - The directory containing route files
 * @param postsDirectory - The directory containing posts in markdown format
 * @param options - Options for sitemap generation, including languages and default language
 * @returns The generated sitemap as an XML string
 */
export async function generateSitemapXML(
  basename: string,
  distDirectory: string,
  postsDirectory: string,
  options: SiteMapOptions = {}
): Promise<string> {
  const routesSitemap = await generateSitemap(basename, distDirectory, options);
  const postsSitemap = await generatePostsSitemap(
    basename,
    postsDirectory,
    options
  );
  // Combine both sitemaps
  const combinedSitemap = [...routesSitemap, ...postsSitemap];

  // Remove duplicates and keep only the latest `lastmod` for each `loc`
  const sitemapMap = new Map<string, string>();
  for (const entry of combinedSitemap) {
    const { loc, lastmod } = entry;
    const existingLastmod = sitemapMap.get(loc);
    if (!existingLastmod || new Date(lastmod) > new Date(existingLastmod)) {
      sitemapMap.set(loc, lastmod);
    }
  }

  // Convert Map to array for XML generation
  const uniqueSitemap = Array.from(sitemapMap.entries()).map(
    ([loc, lastmod]) => ({ loc, lastmod })
  );

  return sitemapToXML(uniqueSitemap);
}

/**
 * Generates content for the robots.txt file, including site and sitemap details.
 * @param domain - The domain of the website (e.g., 'example.com')
 * @returns The generated robots.txt file content
 */
function generateRobotsTxt(domain: string): string {
  return `# *
User-agent: *
Allow: /

# Host
Host: https://${domain}

# Sitemaps
Sitemap: https://${domain}/sitemap.xml
`;
}

/**
 * Saves the generated sitemap XML and robots.txt files to specified file paths.
 * @param config - Configuration object for sitemap and robots.txt generation
 */
export async function saveSitemapAndRobots(
  config: SitemapConfig
): Promise<void> {
  const {
    basename,
    distDirectory,
    postsDirectory,
    sitemapPath,
    robotsPath,
    options = {},
  } = config;

  const domain = new URL(basename).hostname;
  const sitemapXML = await generateSitemapXML(
    basename,
    distDirectory,
    postsDirectory,
    options
  );
  const robotsTxt = generateRobotsTxt(domain);

  await ensureFile(sitemapPath);
  await Deno.writeTextFile(sitemapPath, sitemapXML);

  await ensureFile(robotsPath);
  await Deno.writeTextFile(robotsPath, robotsTxt);
}

/**
 * Converts an array of strings to an object where each string becomes a key with a default value of 1.
 * @param arr - Array of strings
 * @returns Object with each string in arr as a key set to 1
 */
function arrayToObject(arr: string[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const segment of arr) {
    result[segment] = 1;
  }

  return result;
}

/**
 * Generates sitemap entries for static routes, excluding dynamic and grouping directories.
 * Uses a Map to ensure unique `loc` values in the sitemap, keeping only the most recent `lastmod` value.
 * @param basename - The base URL of the website (e.g., 'https://example.com')
 * @param distDirectory - Directory containing route files
 * @param options - Options for sitemap generation, including languages and default language
 * @returns Array of sitemap entries
 */
async function generateSitemap(
  basename: string,
  distDirectory: string,
  options: SiteMapOptions
): Promise<Sitemap> {
  const sitemapMap = new Map<string, string>(); // Key: loc, Value: lastmod

  const pathMap: Record<string, number> = {};

  function processPathSegments(path: string): void {
    if (!path.endsWith(".tsx")) return;

    pathMap[path] = 1;

    if (path.includes("_")) {
      pathMap[path] = 0;
      return;
    }
    if (path.includes("[...slug]")) {
      pathMap[path] = 0;
      return;
    }
  }

  async function addDirectory(directory: string) {
    for await (const path of stableRecurseFiles(directory)) {
      processPathSegments(path);
    }
  }

  await addDirectory(distDirectory);

  for (const path in pathMap) {
    if (pathMap[path] === 1) {
      const filePath = join(path);
      if (!(await exists(filePath))) {
        continue;
      }
      const { mtime } = await Deno.stat(filePath);

      const pathSegments = path.split(SEPARATOR);
      const neededSegmentsPath = pathSegments.join("/");

      const cleanedPath = neededSegmentsPath
        .replace(/\.tsx$/, "")
        .replace(/\index$/, "");

      options.languages?.forEach((lang) => {
        const loc = `${basename}/${lang}${cleanedPath}`;
        const lastmod = (mtime ?? new Date()).toISOString();

        // Check for existing loc and update lastmod if new date is more recent
        const existingLastmod = sitemapMap.get(loc);
        if (!existingLastmod || new Date(lastmod) > new Date(existingLastmod)) {
          sitemapMap.set(loc, lastmod);
        }
      });
    }
  }

  // Convert Map to Sitemap array
  return Array.from(sitemapMap.entries()).map(([loc, lastmod]) => ({
    loc,
    lastmod,
  }));
}

/**
 * Recursively searches for a folder with a specific name within a given directory or its subdirectories.
 * @param baseDirectory - The directory to start searching within
 * @param targetFolderName - The name of the folder to search for
 * @returns The path to the folder if it exists in any subdirectory, otherwise null
 */
async function findFolderPathRecursively(
  baseDirectory: string,
  targetFolderName: string
): Promise<string | null> {
  for await (const entry of Deno.readDir(baseDirectory)) {
    const entryPath = `${baseDirectory}/${entry.name}`;

    if (entry.isDirectory) {
      if (entry.name === targetFolderName) {
        return entryPath;
      } else {
        const foundInSubDir = await findFolderPathRecursively(
          entryPath,
          targetFolderName
        );
        if (foundInSubDir) return foundInSubDir;
      }
    }
  }
  return null;
}

/**
 * Generates sitemap entries for markdown posts, respecting language settings.
 * Checks for existing routes and builds a path for each post.
 * @param basename - The base URL
 * @param postsDirectory - Directory containing post markdown files
 * @param options - Options for sitemap generation, including languages
 * @returns Array of sitemap entries for posts
 */
async function generatePostsSitemap(
  basename: string,
  postsDirectory: string,
  options: SiteMapOptions
): Promise<Sitemap> {
  const sitemap: Sitemap = [];
  const languages = options.languages || [];

  if (!(await exists(postsDirectory))) return sitemap;

  async function addMarkdownFile(path: string) {
    const relPath = path.replace(/\.md$/, "");
    const segments = relPath.split(SEPARATOR);
    const postType = segments[1];
    const postRoute = await findFolderPathRecursively("./routes", postType);
    if (!postRoute) return;

    const routeSegments = postRoute.replace("./routes", "").split(SEPARATOR);
    const neededSegmentsPath = routeSegments.join("/");

    const slugSegmentsPath = segments.slice(3).join("/");
    const pathname = neededSegmentsPath + "/" + slugSegmentsPath;

    const urlPaths =
      languages.length > 0
        ? languages.map((lang) => `/${lang}${pathname}`)
        : [pathname];

    for (const urlPath of urlPaths) {
      const { mtime } = await Deno.stat(path);
      sitemap.push({
        loc: basename.replace(/\/+$/, "") + urlPath,
        lastmod: (mtime ?? new Date()).toISOString(),
      });
    }
  }

  for await (const path of stableRecurseFiles(postsDirectory)) {
    if (path.endsWith(".md")) {
      await addMarkdownFile(path);
    }
  }

  return sitemap;
}

/**
 * Recursively iterates through a directory to retrieve all file paths in a stable, sorted order.
 * @param directory - Directory path to recurse
 * @returns Generator of file paths
 */
async function* stableRecurseFiles(directory: string): AsyncGenerator<string> {
  const itr = Deno.readDir(directory);
  const files: Deno.DirEntry[] = [];
  for await (const entry of itr) {
    files.push(entry);
  }
  const sorted = files.sort(({ name: n0 }, { name: n1 }) =>
    n0.localeCompare(n1)
  );
  for (const entry of sorted) {
    const path = join(directory, entry.name);
    if (entry.isFile) {
      yield path;
    } else if (entry.isDirectory) {
      yield* stableRecurseFiles(path);
    }
  }
}

/**
 * Converts a Sitemap array to an XML string in the required format.
 * @param sitemap - Array of sitemap entries
 * @returns Generated XML string
 */
function sitemapToXML(sitemap: Sitemap): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map(
    ({ loc, lastmod }) =>
      `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
  )
  .join("\n")}
</urlset>`;
}
