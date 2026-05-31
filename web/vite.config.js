import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyDirBeforeWrite: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/ws/sim": {
        target: "ws://127.0.0.1:8765",
        ws: true,
      },
      "/observation.jpg": "http://127.0.0.1:8765",
      "/observation.png": "http://127.0.0.1:8765",
      "/observation.webp": "http://127.0.0.1:8765",
      "/textures": "http://127.0.0.1:8765",
    },
  },
});
