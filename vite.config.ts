import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';

const root = process.cwd();

/**
 * The manifest is not in public/ because it is source, not a static asset. Copying it at
 * the end of the build keeps dist/ exactly what Chrome loads, with no extra folder.
 */
function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      mkdirSync(resolve(root, 'dist'), { recursive: true });
      copyFileSync(resolve(root, 'src/manifest.json'), resolve(root, 'dist/manifest.json'));
    },
  };
}

export default defineConfig({
  root: resolve(root, 'src'),
  publicDir: resolve(root, 'public'),
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    target: 'chrome127',
    sourcemap: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        popup: resolve(root, 'src/popup/index.html'),
        'background/index': resolve(root, 'src/background/index.ts'),
        offscreen: resolve(root, 'src/offscreen/index.html'),
        // The printable timetable. A second page, so the code it shares with the popup
        // lands in a chunk both pages load rather than being copied into each.
        print: resolve(root, 'src/print/index.html'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background/index' ? 'background/index.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  plugins: [copyManifest()],
});
