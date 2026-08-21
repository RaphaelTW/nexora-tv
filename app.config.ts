import type { ConfigContext } from 'expo/config';

const isTV = process.env.EXPO_TV === '1' || process.env.EXPO_TV === 'true';

export default ({ config }: ConfigContext) => ({
  ...config,
  name: 'Nexora TV',
  slug: 'nexora-tv',
  version: '1.0.0',
  orientation: 'default',
  userInterfaceStyle: 'dark',
  scheme: 'nexora',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  assetBundlePatterns: ['**/*'],
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png'
  },
  android: {
    package: isTV ? 'com.raphaeltw.nexoratv.tv' : 'com.raphaeltw.nexoratv',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    permissions: ['INTERNET'],
    softwareKeyboardLayoutMode: 'pan'
  },
  plugins: [
    'expo-router',
    [
      'expo-video',
      {
        supportsPictureInPicture: true,
        supportsBackgroundPlayback: false
      }
    ],
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true
        }
      }
    ],
    [
      '@react-native-tvos/config-tv',
      {
        isTV,
        androidTVBanner: './assets/tv-banner.png',
        androidTVIcon: './assets/tv-icon.png',
        showVerboseWarnings: false
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    isTV,
    eas: {
      projectId: 'a6c03791-5585-4658-a5d8-30f3c90526e4'
    }
  }
});
