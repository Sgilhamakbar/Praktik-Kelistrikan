import { defineConfig } from 'vite';

export default defineConfig({
  // 'base' berguna jika Anda meng-host aplikasi di sub-path (misal: GitHub Pages)
  // Jika di-deploy ke domain utama (misal: Vercel/Netlify), ubah menjadi '/'
  base: './', 
  
  server: {
    port: 3000, // Menjalankan server di http://localhost:3000
    open: true, // Otomatis membuka browser saat perintah 'npm run dev' dijalankan
  },
  
  build: {
    outDir: 'dist', // Folder hasil build siap rilis
    target: 'esnext', // Target browser modern untuk performa terbaik
    minify: 'esbuild', // Kompresi kode super cepat
    emptyOutDir: true, // Bersihkan folder dist lama setiap kali build baru
  }
});