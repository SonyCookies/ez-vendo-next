# Vercel Deployment Guide for EZ-Vendo Next.js

This guide will help you deploy your EZ-Vendo Next.js application to Vercel using GitHub.

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. Your Firebase project credentials

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd ez-vendo-next
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it (e.g., `ez-vendo-next`)
3. **Do NOT** initialize with README, .gitignore, or license (you already have these)
4. Copy the repository URL

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Configure Environment Variables

### 2.1 Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) > **General** tab
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** > **Web** (</> icon)
6. Copy the configuration values

### 2.2 Set Environment Variables in Vercel

You'll set these in Step 3, but here's what you need:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (optional, if using Realtime Database)

## Step 3: Deploy to Vercel

### 3.1 Import Your Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** > **Project**
3. Click **Import Git Repository**
4. Select your GitHub repository (`ez-vendo-next`)
5. Click **Import**

### 3.2 Configure Project Settings

1. **Framework Preset**: Vercel should auto-detect "Next.js" - verify this
2. **Root Directory**: Leave as `./` (or set to `ez-vendo-next` if your repo root is different)
3. **Build Command**: Should be `npm run build` (auto-detected)
4. **Output Directory**: Leave as default (`.next`)
5. **Install Command**: Should be `npm install` (auto-detected)

### 3.3 Add Environment Variables

1. In the **Environment Variables** section, click **Add** for each variable:
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = `your_api_key`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `your_project_id.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `your_project_id`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `your_project_id.appspot.com`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `your_sender_id`
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = `your_app_id`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL` = `https://your_project_id-default-rtdb.firebaseio.com` (if using)

2. Make sure to add them for all environments:
   - **Production** ✓
   - **Preview** ✓
   - **Development** ✓

### 3.4 Deploy

1. Click **Deploy**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like `https://your-project.vercel.app`

## Step 4: Configure Firebase Authentication Domains

### 4.1 Add Vercel Domain to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain:
   - `your-project.vercel.app`
   - `your-custom-domain.com` (if you set one up)

## Step 5: Set Up Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click **Settings** > **Domains**
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update Firebase Authorized domains with your custom domain

## Step 6: Verify Deployment

1. Visit your deployed URL
2. Test the login functionality
3. Test admin routes
4. Check browser console for any errors

## Troubleshooting

### Build Fails

- **Error: Module not found**: Make sure all dependencies are in `package.json`
- **Error: Environment variable missing**: Double-check all environment variables are set in Vercel
- **Error: Build timeout**: Check if you have any long-running processes in your build

### Runtime Errors

- **Firebase not initialized**: Verify all environment variables are set correctly
- **CORS errors**: Make sure your Vercel domain is in Firebase Authorized domains
- **Authentication not working**: Check Firebase Auth settings and authorized domains

### Common Issues

1. **Environment variables not working**: 
   - Make sure they start with `NEXT_PUBLIC_` for client-side access
   - Redeploy after adding new environment variables

2. **Build command issues**:
   - The `--webpack` flag in your build script might cause issues
   - Consider removing it if you encounter build problems

3. **HTTPS/SSL**:
   - Vercel provides HTTPS automatically
   - No need for the `server.js` or certificate files in production

## Continuous Deployment

Once connected, Vercel will automatically:
- Deploy new commits to the `main` branch to **Production**
- Deploy pull requests to **Preview** environments
- Run builds on every push

## Updating Your Deployment

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Vercel will automatically detect the push and redeploy

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Setup](https://firebase.google.com/docs/web/setup)

