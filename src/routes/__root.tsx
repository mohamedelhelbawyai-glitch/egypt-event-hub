import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 bg-grid">
      <div className="relative max-w-md text-center">
        <h1 className="text-8xl font-extrabold tracking-tight brand-gradient-text">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl admin-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-transform hover:-translate-y-0.5"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tazkara · تذكرة — Admin Panel" },
      { name: "description", content: "Egypt's premier event ticketing platform — admin panel" },
      { name: "author", content: "Tazkara" },
      { property: "og:title", content: "Tazkara · تذكرة — Admin Panel" },
      { property: "og:description", content: "Egypt's premier event ticketing platform — admin panel" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tazkara · تذكرة — Admin Panel" },
      { name: "twitter:description", content: "Egypt's premier event ticketing platform — admin panel" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3ad6d023-6374-4367-b7a2-973d0ac511a4/id-preview-0463b3f6--41e5e301-7bbc-4f5d-b71c-e8b2e9f6fca0.lovable.app-1775862776257.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3ad6d023-6374-4367-b7a2-973d0ac511a4/id-preview-0463b3f6--41e5e301-7bbc-4f5d-b71c-e8b2e9f6fca0.lovable.app-1775862776257.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
