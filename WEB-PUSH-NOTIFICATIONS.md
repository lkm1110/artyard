# Web Push Notifications Guide

## Current Status

**Web push notifications are currently DISABLED in ArtYard.**

### Why?

Web push notifications require VAPID (Voluntary Application Server Identification) keys:
- VAPID keys are public/private key pairs for web push authentication
- Service worker configuration is required
- Additional push notification server infrastructure needed
- Significantly increases deployment complexity

### Mobile vs Web

```yaml
Mobile (iOS/Android):
  Status: ✅ ENABLED
  Technology: Expo Push Notifications
  Setup: Automatic via Expo
  
Web (Browser):
  Status: ❌ DISABLED
  Reason: VAPID keys not configured
  Alternative: In-app notifications only
```

## Enabling Web Push (Future Implementation)

If you want to enable web push notifications in the future, follow these steps:

### 1. Generate VAPID Keys

```bash
# Install web-push
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Output:
```
Public Key: BDa...XYZ
Private Key: abc...123
```

### 2. Update app.json

Add the public key to your `app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#E91E63",
      "androidMode": "default",
      "androidCollapsedTitle": "{{unread_count}} new notifications",
      "vapidPublicKey": "YOUR_VAPID_PUBLIC_KEY_HERE"
    }
  }
}
```

### 3. Store Private Key Securely

Add to `.env`:
```env
VAPID_PRIVATE_KEY=your_private_key_here
```

**⚠️ NEVER commit the private key to Git!**

### 4. Set Up Push Server

Create a push notification server or use Firebase Cloud Messaging:

```typescript
// Example: Supabase Edge Function for web push
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@artyard.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Send notification
await webpush.sendNotification(subscription, payload);
```

### 5. Remove Platform.OS === 'web' Checks

Update these files:
- `src/services/pushNotificationService.ts` (line 29)
- `src/components/PushNotificationConsent.tsx` (line 37)
- `src/components/PushNotificationHandler.tsx` (line 21)

Remove or comment out:
```typescript
if (Platform.OS === 'web') {
  console.log('🌐 Push notifications are disabled on web (VAPID key required)');
  return null;
}
```

### 6. Test

```bash
# Rebuild and test
npm start
```

## Alternative: Use Firebase Cloud Messaging (FCM)

For production-ready web push:

1. Create Firebase project
2. Enable Cloud Messaging
3. Get FCM credentials
4. Use `@react-native-firebase/messaging` package
5. Configure service worker

## Current Implementation

ArtYard uses in-app notifications for web:
- Real-time chat updates via Supabase Realtime
- In-app notification center
- No browser notifications

For mobile apps:
- Full push notification support
- Expo Push Notifications service
- Badge counts, sounds, vibration

## Documentation

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)

