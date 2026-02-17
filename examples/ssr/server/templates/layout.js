export function renderHomePage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NidamJS Tailwind Demo</title>

    <script>
      tailwind = {
        config: {
          theme: {
            extend: {
              fontFamily: {
                display: ["Space Grotesk", "ui-sans-serif", "system-ui"]
              },
              colors: {
                ocean: {
                  950: "#050b18"
                }
              }
            }
          }
        }
      };
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/demo/styles.css" />
  </head>

  <body class="font-display text-slate-100 bg-ocean-950 min-h-screen">
    <div class="relative min-h-screen p-4 md:p-6">
      <div
        class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,.25),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,.20),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,.22),transparent_50%)]"
      ></div>

      <header class="mb-4 rounded-xl border border-slate-600/40 bg-slate-900/55 p-4">
        <h1 class="text-xl md:text-2xl font-semibold tracking-wide">NidamJS Minimal Demo</h1>
        <p class="text-sm text-slate-300 mt-1">
          Two live routes opened as windows from one page.
        </p>
      </header>

      <section class="mb-4 flex flex-wrap gap-2">
        <button data-modal="page-one" class="toolbar-btn">Open Page One</button>
        <button data-modal="page-two" class="toolbar-btn">Open Page Two</button>
      </section>

      <footer class="mt-3 text-sm text-slate-300">
        Tip: drag windows by the title bar and use close/maximize buttons.
      </footer>

      <div id="target" data-pending-modal="" class="absolute inset-0 z-40 pointer-events-none"></div>
    </div>

    <script type="module" src="/demo/client.js"></script>
  </body>
</html>`;
}
