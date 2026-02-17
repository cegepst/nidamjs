import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  root: 'examples/app',
  resolve: {
    alias: [
      { 
        find: 'nidamjs/style.css', 
        replacement: resolve(__dirname, './src/styles/styles.css') 
      },
      { 
        find: 'nidamjs', 
        replacement: resolve(__dirname, './src/index.js') 
      },
    ]
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'NidamJS',
      formats: ['es', 'umd'],
      fileName: (format) => `nidam.${format}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'nidam.css';
          return assetInfo.name;
        }
      }
    }
  }
});