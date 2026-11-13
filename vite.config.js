import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  server: { host: '127.0.0.1', port: 5183 },

})
