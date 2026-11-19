import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ashrafux.amoltracker',
  appName: 'আমল ট্র্যাকার',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  plugins: {
    // alarms use the white crescent icon in the status bar, tinted with the brand blue
    LocalNotifications: {
      smallIcon: 'ic_stat_amol',
      iconColor: '#2160D9',
    },
    SystemBars: {
      // The app pads itself with env(safe-area-inset-*), so let the WebView draw edge to edge
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
