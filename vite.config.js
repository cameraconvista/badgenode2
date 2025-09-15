import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isPreview = command === 'preview';
  
  return {
    // 🔧 DEV SERVER: HMR abilitato, porta standard Vite
    server: {
      host: '0.0.0.0',
      port: process.env.PORT || 5173, // Porta standard Vite
      hmr: isDev ? {
        port: process.env.HMR_PORT || 24678 // Porta HMR separata
      } : false,
      open: false // Non aprire browser automaticamente
    },
    
    // 🔧 PREVIEW SERVER: Simula produzione, no HMR
    preview: {
      host: '0.0.0.0', 
      port: process.env.PREVIEW_PORT || 4173,
      open: false
    },
    
    // 🔧 BUILD: Multi-page app con ES2020 target + ottimizzazioni
    build: {
      outDir: 'dist',
      target: 'es2020',
      sourcemap: isDev, // Sourcemap solo in dev
      minify: !isDev,   // Minify solo in build
      rollupOptions: {
        input: {
          main: 'index.html',
          storico: 'storico.html', 
          utenti: 'utenti.html',
          exdipendenti: 'ex-dipendenti.html'
        },
        // 🚀 Tree shaking ottimizzato
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false
        },
        output: {
          // 🚀 Code splitting per chunks comuni (solo moduli interni)
          manualChunks: (id) => {
            if (id.includes('calendar-utils')) {
              return 'utils';
            }
            if (id.includes('supabase-client')) {
              return 'supabase';
            }
          },
          // 🚀 Asset naming ottimizzato per cache
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },
    
    // 🔧 ENV: Prefisso per variabili ambiente
    envPrefix: 'VITE_',
    
    // 🔧 DEFINE: Variabili globali
    define: {
      __DEV__: isDev,
      __PREVIEW__: isPreview
    }
  };
});
