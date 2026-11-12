import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { preloadLocale } from "./vite-locale-preload";

// In development the web app runs on Vite (port 5173) and proxies /api,
// including the WebSocket at /api/ws, to the server (port 3000). In
// production the server serves the built files itself (WEB_DIR), so one
// process serves the API, the WebSocket and the app.
const rootEnv = loadEnv("development", fileURLToPath(new URL("../..", import.meta.url)), ["PORT", "PUBLIC_URL"]);
const serverPort = Number(rootEnv.PORT) || 3000;
const publicUrl = URL.parse(rootEnv.PUBLIC_URL ?? "");
const publicPort = publicUrl?.hostname === "localhost" ? Number(publicUrl.port) : 0;
const webPort = publicPort && publicPort !== serverPort ? publicPort : 5173;

// React Compiler: components and hooks are memoized at build time (what doesn't follow the rules of
// React is left as written; `"use no memo"` opts a file out).
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    preloadLocale(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: webPort,
    strictPort: true,
    proxy: { "/api": { target: `http://localhost:${serverPort}`, ws: true } },
  },
  // `screen.html`: the agent's screen for the phone app (ADR 0098), a small page of its own, not the web app.
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        screen: fileURLToPath(new URL("./screen.html", import.meta.url)),
      },
    },
  },
});
