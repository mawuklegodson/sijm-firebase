# Salvation In Jesus Ministry CMS - Authentication & Admin Setup Guide

This guide explains how to set up the authentication system and configure your first **Super Admin** account using Firebase.

## 1. Firebase Console Configuration

Before users can log in, you must enable the authentication providers in your [Firebase Console](https://console.firebase.google.com/):

1.  **Authentication**:
    *   Go to **Build > Authentication > Sign-in method**.
    *   Enable **Email/Password**.
    *   (Optional) Enable **Google** or **Apple** if you wish to use social login.
2.  **Firestore Database**:
    *   Ensure Cloud Firestore is created in **Production Mode** or **Test Mode**.
    *   The app will automatically create the `profiles` collection when the first user logs in.

---

## 2. Creating the First Super Admin

Since the system is secure by default, the first user who signs up will have standard "Member" permissions. To promote yourself to **Super Admin**:

### Step A: Create the Account
1.  Open the application landing page.
2.  Click **Connect** or go to the Login page.
3.  Sign up with your email and a strong password.
4.  Once logged in, you will see the **Member Dashboard** (this is normal).

### Step B: Promote via Firestore Console
1.  Open your [Firebase Console](https://console.firebase.google.com/).
2.  Go to **Build > Firestore Database**.
3.  Locate the `profiles` collection.
4.  Find the document where the `email` matches your account.
5.  Edit the following fields:
    *   `workerPermissions`: Change this to an array containing `"Super Admin"`.
        *   Example: `["Super Admin"]`
    *   `identityRole`: Change this to `"Leader"` or `"Pastor"`.
        *   Example: `"Leader"`
6.  **Refresh the application**. You should now see the **Super Admin Dashboard** with full access to settings, user management, and the landing page editor.

---

## 3. Managing Staff and Ushers

Once you are a Super Admin, you can manage other users directly within the app:

1.  Go to the **Staff Management** (or **Ushers**) section in the sidebar.
2.  Click **Add New Staff**.
3.  Assign their **Identity Role** (e.g., Member, Pastor) and **Worker Permissions**:
    *   **Usher**: Access to attendance, first-timers, and absentees.
    *   **Admin**: Access to most administrative features.
    *   **Media Team**: Access to resource management (Sermons/Downloads).
    *   **Super Admin**: Full system control.

---

## 4. Troubleshooting Common Errors

### Error: `auth/unauthorized-domain`
This happens when Google Sign-In is attempted from a domain that isn't white-listed in Firebase.
1.  Go to **Firebase Console > Authentication > Settings > Authorized domains**.
2.  Add the following domains:
    *   `ais-dev-vulfvqcmkbznjqsjhhiyqx-49683148709.europe-west1.run.app`
    *   `ais-pre-vulfvqcmkbznjqsjhhiyqx-49683148709.europe-west1.run.app`

### Error: `Failed to get document because the client is offline`
This usually means the browser cannot reach the Firebase servers.
1.  **Check Internet**: Ensure your connection is stable.
2.  **Firebase Config**: Double-check your environment variables in AI Studio. If `projectId` or `apiKey` is wrong, Firestore might fail to connect.
3.  **Firestore Setup**: Ensure you have clicked "Create Database" in the Firestore tab of your Firebase console.
4.  **Browser Extensions**: Some ad-blockers or privacy extensions can block Firebase. Try disabling them or using an incognito window.
