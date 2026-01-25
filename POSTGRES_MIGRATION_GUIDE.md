# PostgreSQL Migration Guide

This guide will help you migrate from SQLite to PostgreSQL for Vercel deployment.

## Step 1: Create a PostgreSQL Database

### Option A: Neon.tech (Recommended - Free Tier)
1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" (can use GitHub)
3. Create a new project
4. Copy your connection string (looks like: `postgresql://user:password@host/database?sslmode=require`)

### Option B: Vercel Postgres
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage tab
3. Create Postgres database
4. Copy the `POSTGRES_PRISMA_URL` connection string

## Step 2: Update Prisma Schema

**File: `backend/prisma/schema.prisma`**

Change the datasource from:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 3: Update Environment Variables

**File: `backend/.env`**

Replace your DATABASE_URL with the PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

**File: `backend/.env.production`**

Add the same for production:
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

## Step 4: Delete Old Migrations (Fresh Start)

Since we're switching databases, we need fresh migrations:

```powershell
cd backend
rm -r prisma/migrations
```

## Step 5: Create New PostgreSQL Migrations

```powershell
cd backend
npx prisma migrate dev --name init_postgres
```

This will:
- Create a new migrations folder
- Apply all schema changes to PostgreSQL
- Generate Prisma Client for PostgreSQL

## Step 6: Seed Your Database (Optional)

If you have seed scripts:
```powershell
cd backend
npx tsx src/seed-admin.ts
npx tsx src/seed-categories.ts
```

## Step 7: Test Locally

1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev` (from root)
3. Try logging in and creating a request
4. Verify data persists

## Step 8: Deploy to Vercel

1. Push your changes to GitHub
2. Go to Vercel Dashboard
3. Add environment variables:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `BETTER_AUTH_SECRET` = Your auth secret
   - `BETTER_AUTH_URL` = Your Vercel deployment URL
   - `RESEND_API_KEY` = Your Resend API key
4. Deploy!

## Important Notes

- **PostgreSQL vs SQLite Differences:**
  - Auto-increment: PostgreSQL uses `SERIAL` or `@default(autoincrement())`
  - Case sensitivity: PostgreSQL is case-sensitive
  - DateTime: Handled slightly differently but Prisma manages this

- **Connection Pooling:**
  - For production, consider using Prisma's connection pooling
  - Neon and Vercel Postgres both provide pooled connections

- **Backup:**
  - If you have important data in SQLite, export it before migration
  - Consider using Prisma Studio to view/export data: `npx prisma studio`

## Troubleshooting

### "Too many connections" error
- Use a pooled connection string
- Reduce concurrent requests in development

### Migration conflicts
- Delete `prisma/migrations` folder and start fresh
- Run `npx prisma migrate reset` (⚠️ drops all data!)

### SSL errors
- Ensure your connection string includes `?sslmode=require`
- Check if your database provider requires SSL

## Next Steps After Migration

1. Update all `.env` files with new DATABASE_URL
2. Test all CRUD operations locally
3. Deploy to Vercel
4. Run production migrations via Vercel CLI or dashboard
5. Monitor database performance in Neon/Vercel dashboard
