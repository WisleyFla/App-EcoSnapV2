import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecosnap.app',
  appName: 'EcoSnap',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#275736'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#275736',
      showSpinner: false
    }
  }
};

export default config;