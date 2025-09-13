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
    
    // 🔧 BUILD: Multi-page app con ES2020 target
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
