import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  publicDir: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  build: {
    lib: { entry: resolve("frontend/main.jsx"), formats: ["es"], fileName: () => "folio-app.js" },
    outDir: "public/build",
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
