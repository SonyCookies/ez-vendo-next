# Quick Vercel Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. **Import** your `ez-vendo-next` repository
4. Vercel will auto-detect Next.js - click **"Deploy"**

### 3. Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

**Important:** Add these for **Production**, **Preview**, and **Development** environments.

### 4. Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Authentication** → **Settings** → **Authorized domains**
3. Add your Vercel domain: `your-project.vercel.app`

### 5. Redeploy

After adding environment variables, click **"Redeploy"** in Vercel.

## ✅ That's it!

Your app will be live at `https://your-project.vercel.app`

---

## 📝 Detailed Instructions

See `DEPLOYMENT.md` for complete step-by-step instructions.

## 🔧 Troubleshooting

**Build fails?**
- Check that all environment variables are set
- Remove `--webpack` from build script if needed

**Firebase errors?**
- Verify environment variables are correct
- Check Firebase Authorized domains includes your Vercel URL

**Need help?**
- Check `DEPLOYMENT.md` for detailed troubleshooting

