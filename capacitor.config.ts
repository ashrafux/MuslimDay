import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ashrafux.amoltracker',
  appName: 'আমল ট্র্যাকার',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  plugins: {
    SystemBars: {
      // The app pads itself with env(safe-area-inset-*), so let the WebView draw edge to edge
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
