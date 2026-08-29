import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  root: "src/console",
  base: "/console/",
  plugins: [cloudflare()],
  define: {
    __OIDRUNE_DEMO__: JSON.stringify(mode === "demo"),
  },
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
}));
