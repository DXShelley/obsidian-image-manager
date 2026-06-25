import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'obsidian-image-manager';
const base = process.env.GITHUB_ACTIONS ? `/${repositoryName}/` : '/';

export default defineConfig({
  base,
  plugins: [react()]
});
