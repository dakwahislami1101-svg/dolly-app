import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Sync dolly_logo.jpg into standard asset files automatically so Android/Capacitor builds always grab the latest icon
try {
  const sourcePath = path.resolve(process.cwd(), 'public/dolly_logo.jpg');
  if (fs.existsSync(sourcePath)) {
    // List of all target paths
    const targetDirs = [
      path.resolve(process.cwd(), 'public'),
      path.resolve(process.cwd(), 'assets')
    ];

    // Create directories if they do not exist
    targetDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const targets = [
      path.resolve(process.cwd(), 'public/icon.jpg'),
      path.resolve(process.cwd(), 'public/icon.png'),
      path.resolve(process.cwd(), 'public/favicon.png'),
      path.resolve(process.cwd(), 'assets/icon.png'),
      path.resolve(process.cwd(), 'assets/icon-only.png'),
      path.resolve(process.cwd(), 'assets/icon-foreground.png'),
      path.resolve(process.cwd(), 'assets/icon-background.png'),
      path.resolve(process.cwd(), 'assets/logo.png'),
      path.resolve(process.cwd(), 'assets/splash.png'),
      path.resolve(process.cwd(), 'assets/splash-dark.png')
    ];

    targets.forEach(target => {
      fs.copyFileSync(sourcePath, target);
    });
    console.log('Successfully synchronized Dolly premium logo to all public and asset icon/splash targets.');
  }
} catch (e) {
  console.warn('Silent warning on logo copying:', e);
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
