# Firebase & Deployment Guide

Follow these steps to transition from local mock data to a live cloud database.

## 1. Firebase Project Setup
1. Create a project at [firebase.google.com](https://console.firebase.google.com/).
2. Follow the instructions in `docs/firebase-setup.md` to set up Authentication and Firestore.

## 2. Firestore Security Rules (CRITICAL)
By default, your app will fail to save or read data if security rules aren't set.
1. In your Firebase Dashboard, go to **Build > Firestore Database > Rules**.
2. Ensure you have rules that allow `authenticated` users to read and write.
3. The guide in `docs/firebase-setup.md` provides a basic rule set to get started.

## 3. Environment Variables
Copy your Firebase configuration values to your hosting provider:
- `VITE_FIREBASE_API_KEY`: Your API Key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Auth Domain.
- `VITE_FIREBASE_PROJECT_ID`: Your Project ID.
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Storage Bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Messaging Sender ID.
- `VITE_FIREBASE_APP_ID`: Your App ID.
- `API_KEY`: Your Google Gemini API Key....

## 4. Why data might not show up
If your system is in "Ministry Cloud" mode but shows no members:
1. **Check Security Rules**: Go to the Firebase Rules tab. If your rules are too restrictive, the app won't be able to fetch data.
2. **Check Authentication**: Ensure you are logged in as a valid staff member.
3. **Verify Collections**: Ensure your collections are named correctly (members, attendance, etc.) as defined in the store logic.
