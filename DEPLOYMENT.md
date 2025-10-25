# Deployment Guide

## Overview
This application consists of two parts:
- **Backend**: FastAPI server (deployed on Railway)
- **Frontend**: Next.js application (deployed on Vercel)

## Quick Start (Web-based Deployment)

This guide uses the web interfaces - no CLI installation needed!

## Backend Deployment (Railway)

### Prerequisites
- Railway account (sign up at https://railway.app)
- Anthropic API key (from your account)

### Steps

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo" or "Empty Project"

2. **If using Empty Project:**
   - Click "Add Service" → "Empty Service"
   - In the service settings, go to "Settings" tab
   - Under "Source", click "Connect Repo" or "Upload Files"
   - Upload your `backend` folder

3. **Configure Environment Variables**
   - In your Railway project, click on your service
   - Go to "Variables" tab
   - Add the following variables:
     ```
     ANTHROPIC_API_KEY=sk-ant-api03-...
     ```

4. **Configure Deployment**
   - Railway will auto-detect Python and use the `railway.json` config
   - It will automatically install dependencies from `requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Generate a Public URL**
   - Go to "Settings" tab
   - Click "Generate Domain" under "Networking"
   - Copy your backend URL (e.g., `https://your-app.railway.app`)

### Configuration
The backend uses `railway.json` for configuration:
- Build: NIXPACKS (auto-detects Python)
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Restart policy: ON_FAILURE with max 10 retries

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- Backend deployed and URL obtained from Railway

### Steps

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Click "Add New..." → "Project"

2. **Import Your Project**
   - Option A: Import from Git (recommended)
     - Connect your GitHub/GitLab/Bitbucket account
     - Select your repository
     - Select the `frontend` folder as the root directory
   - Option B: Deploy from local
     - Use drag & drop to upload your `frontend` folder

3. **Configure Project**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./frontend` (if deploying from repo root)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Set Environment Variables**
   - In the deployment settings, add environment variables:
     - Key: `NEXT_PUBLIC_API_URL`
     - Value: `https://your-backend-url.railway.app` (use your actual Railway URL)
   - Apply to: **All environments** or just **Production**

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)
   - Vercel will give you a URL like: `https://your-app.vercel.app`

6. **Test Your Application**
   - Visit your Vercel URL
   - Upload a sample SOW document
   - Verify the analysis works end-to-end

## Environment Variables

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

## Testing After Deployment

1. **Test backend health**
   ```bash
   curl https://your-backend-url.railway.app/
   ```
   Expected response:
   ```json
   {
     "status": "online",
     "service": "SOW Analyzer API",
     "version": "1.0.0"
   }
   ```

2. **Test frontend**
   Open your Vercel URL in a browser and upload a sample SOW document.

## Troubleshooting

### Backend issues
- Check Railway logs: `railway logs`
- Ensure environment variables are set correctly
- Verify Python dependencies in requirements.txt

### Frontend issues
- Check Vercel logs in the dashboard
- Ensure NEXT_PUBLIC_API_URL is set correctly
- Check CORS configuration in backend

## Recommended: GitHub-Based Deployment (Easiest Method)

Both Railway and Vercel support GitHub integration for automatic deployments:

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   cd /Users/sohamkolhe/calhacks
   git init
   git add .
   git commit -m "Initial commit - SOW Analyzer"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sow-analyzer.git
   git push -u origin main
   ```

### Step 2: Deploy Backend to Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Choose the `backend` folder as root directory
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Railway will automatically:
   - Detect Python project
   - Install dependencies from requirements.txt
   - Use railway.json for configuration
   - Deploy and generate a URL
7. Copy the generated URL (e.g., `https://sow-analyzer.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Root Directory: `frontend`
   - Framework: Next.js (auto-detected)
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = Your Railway backend URL
5. Click "Deploy"
6. Done! Your app is live

### Benefits of GitHub Integration:
- ✅ Automatic deployments on every push
- ✅ Preview deployments for pull requests
- ✅ Easy rollbacks to previous versions
- ✅ Team collaboration
- ✅ CI/CD pipeline built-in

## Cost Estimates

- **Railway**: Free tier includes $5/month credit (~500 hours of runtime)
- **Vercel**: Free tier includes unlimited deployments and 100GB bandwidth
- **Anthropic API**: ~$0.02-0.05 per SOW analysis with Claude Haiku
- **Total**: $0/month with free tiers (API costs only apply per usage)
