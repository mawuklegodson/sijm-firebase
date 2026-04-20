# SIJM Mobile App Setup — Capacitor + PWA Guide

## Overview
SIJM is deployed as both a **PWA** (installable from browser) and a **native mobile app** (Android & iOS) using **Capacitor 5**. This guide covers everything needed to build and publish to both app stores.

---

## 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/push-notifications @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen @capacitor/app @capacitor/share @capacitor/filesystem
npx cap init
```

---

## 2. capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.sijm.app',
  appName: 'SIJM',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // For development: point to your dev server
    // url: 'http://192.168.1.X:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#002366',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'large',
      spinnerColor: '#fbbf24',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#002366',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
};

export default config;
```

---

## 3. Build & Sync

```bash
# Build the web app
npm run build

# Copy build to native projects
npx cap sync

# Add platforms (first time only)
npx cap add android
npx cap add ios
```

---

## 4. Run on Device / Emulator

```bash
# Android
npx cap open android     # Opens Android Studio
# Then: Run > Run App (select device/emulator)

# iOS (Mac only)
npx cap open ios         # Opens Xcode
# Then: Product > Run (select simulator or device)
```

---

## 5. Push Notifications (Firebase Cloud Messaging)

### Android
1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. In `android/build.gradle`, add: `classpath 'com.google.gms:google-services:4.3.15'`
4. In `android/app/build.gradle`, add at the bottom: `apply plugin: 'com.google.gms.google-services'`

### iOS
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to the Xcode project root
3. Enable Push Notifications capability in Xcode: Signing & Capabilities > + Push Notifications

### Register for Push in your app:
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  const result = await PushNotifications.requestPermissions();
  if (result.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    console.log('FCM Token:', token.value);
    // Save token to Firestore for this user
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action);
    // Navigate to relevant page
  });
};
```

---

## 6. App Store Assets Needed

### Android (Google Play)
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: at least 2 phone screenshots (1080x1920 or 9:16 ratio)
- Short description: max 80 chars
- Full description: max 4000 chars
- Content rating: Everyone

### iOS (App Store)
- App icon: 1024x1024 PNG (no transparency)
- Screenshots: iPhone 6.5" (1242x2688) and iPad 12.9" (2048x2732)
- Privacy Policy URL (required)
- App Store description

---

## 7. PWA Enhancements (Configured via vite-plugin-pwa)

The PWA is now managed through `vite.config.ts`, which automatically handles:
- ✅ **Installability**: Browser prompts for "Add to Home Screen".
- ✅ **Asset Caching**: Core JS, CSS, and HTML are cached for offline use.
- ✅ **Image Caching**: External images from Unsplash are cached via Workbox.
- ✅ **Theme & Branding**: Icons and splash screen colors are synchronized with the SIJM brand.

### Global Marquee Alerts
Broadcasts managed in the **Announcements Hub** appear as a scrolling marquee in the PWA. These are closable by the user and can be scheduled to expire automatically, making them ideal for mobile-first ministry updates.

### Upgrade `sw.js` for background sync:
```javascript
// In sw.js — add background sync for offline attendance submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingAttendance());
  }
});

async function syncPendingAttendance() {
  const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
  for (const record of pending) {
    try {
      await fetch('/api/attendance', { method: 'POST', body: JSON.stringify(record) });
    } catch (e) {
      throw e; // Will retry
    }
  }
  localStorage.removeItem('pending_sync');
}
```

---

## 8. Publishing Checklist

### Pre-submission
- [ ] App icon set (all sizes) generated
- [ ] Splash screens generated  
- [ ] Privacy Policy page created and linked
- [ ] Google Play Developer account ($25 one-time fee)
- [ ] Apple Developer account ($99/year)
- [ ] Firebase Push Notifications configured
- [ ] Release build signed (Android keystore created)
- [ ] iOS distribution certificate + provisioning profile

### Android Release Build
```bash
cd android
./gradlew assembleRelease
# Or for AAB (recommended for Play Store):
./gradlew bundleRelease
# Sign with your keystore then upload to Play Console
```

### iOS Release Build
- Open Xcode → Product → Archive → Distribute App → App Store Connect

---

## 9. Recommended Capacitor Plugins for SIJM

| Plugin | Purpose |
|--------|---------|
| `@capacitor/push-notifications` | Service announcements, prayer reminders |
| `@capacitor/haptics` | Tactile feedback on form submit |
| `@capacitor/status-bar` | Match SIJM brand color |
| `@capacitor/splash-screen` | Branded launch screen |
| `@capacitor/camera` | Profile photo, document scanning |
| `@capacitor/filesystem` | Download PDFs/ebooks locally |
| `@capacitor/share` | Share sermons, events |
| `@capacitor/local-notifications` | Service reminders |
| `@capacitor/network` | Offline detection for sync queue |
