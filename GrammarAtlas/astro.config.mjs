import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://zhangxueshan246.github.io',
  base: '/Sanskrit',
});
