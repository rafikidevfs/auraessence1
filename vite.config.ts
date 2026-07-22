import tailwindcss from '@tailwindcss/vite'; // <--- Faltou esse import no topo!
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
  ],
});
