// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AuthProvider } from "~/lib/auth";
import { NotificationProvider } from "~/context/NotificationContext";
import "./app.css";
import { Toaster } from "react-hot-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </AuthProvider>
  );
}

