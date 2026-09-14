import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zuowen.kaoyangogogo.fun',
  output: 'static',
  publicDir: './assets',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
