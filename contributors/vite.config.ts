import { defineConfig } from "vite";

export default defineConfig({
  base: "/voyonsvoir/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
  },
});
