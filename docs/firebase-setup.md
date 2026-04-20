# Firebase Setup Guide

Follow these steps to set up your Firebase project for the SIJM Ministry Portal.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the prompts to create a new project.

## 2. Enable Authentication
1. In the Firebase console, go to **Build > Authentication**.
2. Click **Get started**.
3. In the **Sign-in method** tab, enable **Email/Password**.

## 3. Set Up Cloud Firestore
1. In the Firebase console, go to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a location and start in **Production mode**.
4. Once created, go to the **Rules** tab and set the following rules for development (Note: You should refine these for production):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 4. Register Your Web App
1. In the Project Overview page, click the **Web** icon (</>) to register a new web app.
2. Enter an app nickname and click **Register app**.
3. You will be provided with a `firebaseConfig` object. Copy these values to your environment variables.

## 5. Environment Variables
Add the following variables to your `.env` file or hosting provider settings:
- `VITE_FIREBASE_API_KEY`: Your API Key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Auth Domain.
- `VITE_FIREBASE_PROJECT_ID`: Your Project ID.
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Storage Bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Messaging Sender ID.
- `VITE_FIREBASE_APP_ID`: Your App ID.
- `API_KEY`: Your Google Gemini API Key./

## 6. Initial Data
The application will automatically initialize the `settings` document in the `settings` collection if it doesn't exist. Other collections will be created as you add data through the application.
