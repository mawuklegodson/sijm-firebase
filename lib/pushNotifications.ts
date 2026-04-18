import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  try {
    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      await PushNotifications.register();
    }

    PushNotifications.addListener('registration', (token) => {
      console.log('FCM Token:', token.value);
      // Save token to Firestore for this user if needed
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.warn('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      // Determine what to do based on the notification action
    });
  } catch (error) {
    console.warn('Push Notifications not available in this environment', error);
  }
};
