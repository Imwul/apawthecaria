import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('/src/gameData.ts') || id.includes('/src/rules/data/')) return 'canonical-data';
          // ~1MB of road polylines that only change when the map is re-traced: cache it apart from app code.
          if (id.includes('/src/data/roadNetworkGeometry')) return 'map-geometry';
        },
      },
    },
  },
})
