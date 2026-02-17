import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'examples/app',
  resolve: {
    alias: {
      'nidamjs': resolve(__dirname, 'src/index.js')
    }
  }
});
