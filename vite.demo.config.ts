import { defineConfig } from "vite";

export default defineConfig({
  root: "src/console",
  define: {
    __OIDRUNE_DEMO__: "true",
  },
});
