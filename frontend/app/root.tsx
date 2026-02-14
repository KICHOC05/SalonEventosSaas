import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  isRouteErrorResponse,
} from "react-router";
import { Rocket } from "lucide-react";
import type { Route } from "./+types/root";
import "./app.css";

/* ── meta / links ── */
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
  },
];

/* ── HTML shell ── */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="spacekids">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-base-100">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/* ── Root: SOLO renderiza el Outlet ── */
export default function Root() {
  return <Outlet />;
}

/* ── Error boundary ── */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "Ha ocurrido un error inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "Página no encontrada."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-8">
      <div className="card bg-base-100 shadow-lg max-w-md w-full">
        <div className="card-body items-center text-center">
          <Rocket className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-6xl font-bold text-error">{message}</h1>
          <p className="text-base-content/60 mt-2">{details}</p>
          {stack && (
            <pre className="text-xs text-left w-full overflow-auto mt-4 p-3 bg-base-200 rounded-lg">
              {stack}
            </pre>
          )}
          <Link to="/" className="btn btn-primary mt-4">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}