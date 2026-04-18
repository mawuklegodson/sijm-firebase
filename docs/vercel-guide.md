
# Vercel Deployment Guide - Fixing 404 Errors

If you are still seeing a `404: NOT_FOUND` error, Vercel is likely looking for your files in a folder that doesn't exist (like `/dist`). Follow these steps to force Vercel to serve your project from the root.

## 1. The Dashboard "Nuclear Option"
This is the most reliable way to fix the 404 error:

1.  Open your project in the [Vercel Dashboard](https://vercel.com).
2.  Go to **Settings** > **General**.
3.  Find **Build & Development Settings**.
4.  **Framework Preset**: Select **"Other"**.
5.  **Build Command**: Toggle **OVERRIDE** and enter: `echo "No build"`
6.  **Output Directory**: Toggle **OVERRIDE** and enter: `.` (just a single dot).
7.  **Install Command**: Toggle **OVERRIDE** and enter: `npm install`
8.  **Development Command**: Toggle **OVERRIDE** and enter: `npm start`
9.  Click **Save**.
10. Go to the **Deployments** tab, find your latest deployment, click the dots, and select **Redeploy**.

## 2. Why this works
By setting the **Output Directory** to `.` (dot), you are telling Vercel that your `index.html` is in the main folder, not inside a `dist` or `public` subfolder. 

## 3. Verify Local Files
Ensure that `index.html` and `vercel.json` are both in the root directory of your repository. If they are inside a `src/` folder, Vercel will not find them unless you set the "Root Directory" in Vercel settings to `src`.

## 4. SPA Routing
The `vercel.json` is configured with a "rewrite" rule. This ensures that if you go directly to `https://your-app.vercel.app/members`, Vercel doesn't look for a file named `members`. Instead, it serves `index.html`, and the React app takes over the navigation.

```json
{
  "rewrites": [
    { "handle": "filesystem" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 5. Environment Variables
Check **Settings** > **Environment Variables** one last time. If `SUPABASE_URL` or `SUPABASE_ANON_KEY` are missing, the app may load but will show no data or a connection error.
