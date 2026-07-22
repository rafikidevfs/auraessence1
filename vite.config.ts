import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
  },
  vite: {
    // Sobrescreve a configuração do Nitro para o ambiente Vercel
    nitro: {
      preset: "vercel",
    },
  },
});
