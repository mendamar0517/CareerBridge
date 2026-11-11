import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Хөгжүүлэлтийн үед /api хүсэлтийг Express API (3000) руу дамжуулна.
// Production-д Express өөрөө dist/-г түгээдэг тул нэг домэйн, CORS шаардлагагүй.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.VITE_API_URL || 'http://localhost:3000' },
  },
});
