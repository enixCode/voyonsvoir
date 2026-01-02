import { defineConfig } from "vite";

export default defineConfig({
  base: "/voyonsvoir/contributors-3d/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
  },
});
