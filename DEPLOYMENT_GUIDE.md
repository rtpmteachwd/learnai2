# LearnAI Deployment Guide

This guide will help you deploy LearnAI for free so your respondents can test the app.

---

## Quick Deployment Summary

| Platform | Setup Time | Free Tier | Best For |
|----------|------------|-----------|----------|
| **Render** | ~10 min | 750 hours/month | Quickest setup |
| **Railway** | ~15 min | $5 credits/month | Best database |
| **Vercel + Neon** | ~20 min | Generous free tier | Best performance |

---

## Before You Deploy

### 1. Push to GitHub

If you haven't already:

```bash
# Initialize git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/learnai.git
git branch -M main
git push -u origin main
```

### 2. Get Your Groq API Key

1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy it (starts with `gsk_`)

---

## Option 1: Render (Recommended for Quick Testing)

### Step 1: Create Account
1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your GitHub account

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account
3. Select your `learnai` repository

### Step 3: Configure

| Setting | Value |
|---------|-------|
| **Name** | learnai |
| **Region** | Singapore (closest to Philippines) |
| **Branch** | main |
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build` |
| **Start Command** | `npx prisma db push --accept-data-loss && npm run start` |
| **Instance Type** | Free |

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:./db/production.db` |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_API_KEY` | `gsk_YOUR_GROQ_API_KEY` |
| `AI_MODEL` | `llama-3.3-70b-versatile` |
| `NODE_ENV` | `production` |

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes
3. Your app URL: `https://learnai.onrender.com`

**Note:** The free tier spins down after 15 minutes of inactivity. First load may take 30-60 seconds.

---

## Option 2: Railway (Best for Persistent Data)

### Step 1: Create Account
1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up with GitHub

### Step 2: Create Database
1. Click **"New Project"** → **"Provision PostgreSQL"**
2. Wait for creation
3. Click database → **"Variables"** tab
4. Copy the `DATABASE_URL`

### Step 3: Update Prisma Schema

Before deploying, change your `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 4: Deploy Web Service
1. Click **"New"** → **"GitHub Repo"**
2. Select your `learnai` repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build` |
| **Start Command** | `npm run start` |

### Step 5: Add Environment Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste from Step 2) |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_API_KEY` | `gsk_YOUR_GROQ_API_KEY` |
| `AI_MODEL` | `llama-3.3-70b-versatile` |

### Step 6: Generate Domain
1. Settings → Domains → Generate Domain
2. Your app URL: `https://learnai-production.up.railway.app`

---

## Option 3: Vercel + Neon (Most Reliable)

### Step 1: Create Neon Database
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create project named `learnai`
4. Select Singapore region
5. Copy connection string

### Step 2: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### Step 3: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import `learnai` repository

### Step 4: Configure

| Setting | Value |
|---------|-------|
| **Framework** | Next.js |

### Step 5: Add Environment Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (Neon connection string) |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_API_KEY` | `gsk_YOUR_GROQ_API_KEY` |
| `AI_MODEL` | `llama-3.3-70b-versatile` |

### Step 6: Update Schema for PostgreSQL

Change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 7: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app URL: `https://learnai.vercel.app`

---

## Troubleshooting

### Common Issues

1. **Build fails with Prisma error**
   - Make sure `prisma generate` runs in build command
   - Check DATABASE_URL is set correctly

2. **App works but AI features don't**
   - Verify AI_API_KEY is correct
   - Check AI_BASE_URL is set to `https://api.groq.com/openai/v1`

3. **Database is empty after deployment**
   - Run seed command: add to build command: `&& npx prisma db seed`
   - Or manually create users through the registration page

4. **Free tier spins down (Render)**
   - First load takes 30-60 seconds
   - This is normal for free tier

### Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs

---

## Quick Reference

### Default Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Student | student@test.com | password123 |
| Teacher | teacher@test.com | password123 |
| Admin | admin@test.com | password123 |

### Environment Variables Checklist

- [ ] `DATABASE_URL` - Database connection
- [ ] `AI_BASE_URL` - `https://api.groq.com/openai/v1`
- [ ] `AI_API_KEY` - Your Groq API key
- [ ] `AI_MODEL` - `llama-3.3-70b-versatile`
