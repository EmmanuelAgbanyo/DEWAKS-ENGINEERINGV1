# Deploying to Vercel

This guide explains how to host your full-stack application (Vite Frontend + Hono Backend) on Vercel.

## 1. Prerequisites
- A [Vercel Account](https://vercel.com).
- A [GitHub Account](https://github.com) (recommended) to push your code.
- **IMPORTANT**: Vercel does not support SQLite (your current database) or local file uploads efficiently. You must migrate to:
  - **Database**: PostgreSQL (e.g., Vercel Postgres, Neon, or Supabase).
  - **Storage**: Blob Storage (e.g., Vercel Blob, AWS S3, or Cloudinary).

## 2. Preparation Checklists

### Database Migration (SQLite -> Postgres)
1. Get a Postgres Connection URL (e.g., from [Neon.tech](https://neon.tech) or Vercel Storage).
2. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Delete `backend/prisma/migrations` folder (if you want a fresh start) or ensure migrations are compatible.
4. Run `npx prisma migrate dev` locally with the new connection string to initialize the DB.

### File Uploads
Your current code saves files to `backend/uploads`. This will **not work on Vercel** (files disappear after execution).
- You should update `backend/src/routes/upload.ts` to use a cloud provider.
- *Temporary Workaround*: If you don't update this, uploads will appear to work but files will be lost immediately.

## 3. Deployment Steps

We recommend deploying as **two separate Vercel projects** for best results (one for Frontend, one for Backend).

### Part A: Deploy Backend
1. Push your code to GitHub.
2. Go to Vercel Dashboard -> **Add New Project**.
3. Import your repository.
4. **Project Configuration**:
   - **Root Directory**: `backend` (Click "Edit" next to Root Directory).
   - **Framework Preset**: select "Other" or let it auto-detect (it handles Hono/Node defaults well).
   - **Environment Variables**:
     - `DATABASE_URL`: Your Postgres connection string.
     - `BETTER_AUTH_SECRET`: Your auth secret.
     - `BETTER_AUTH_URL`: The URL of this backend (e.g., `https://your-backend.vercel.app`).
5. Click **Deploy**.
6. Note the **Deployment URL** (e.g., `https://project-backend.vercel.app`).

### Part B: Deploy Frontend (Webapp)
1. Go to Vercel Dashboard -> **Add New Project** (using the same repo).
2. **Project Configuration**:
   - **Root Directory**: `webapp`.
   - **Framework Preset**: Vite (should auto-detect).
   - **Environment Variables**:
     - `VITE_BACKEND_URL`: The Backend URL from Part A (e.g., `https://project-backend.vercel.app`).
     - `VITE_RESEND_API_KEY`: Your Resend Key.
3. Click **Deploy**.

## 4. Updates & Management
- Anytime you push to GitHub, Vercel will automatically redeploy both apps.
- Monitoring: distinct logs for Frontend and Backend in Vercel Dashboard.
