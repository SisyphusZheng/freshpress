import type { PageProps } from "fresh";

export default function App({ Component }: PageProps) {
  return (
    <html data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>example</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/gfm.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
