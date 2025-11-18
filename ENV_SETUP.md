# Environment Configuration Guide

This guide explains how to configure the API base URL for development and production environments.

## Environment Variables

The application uses Vite environment variables. All environment variables must be prefixed with `VITE_` to be accessible in the application.

### Required Variable

- `VITE_API_BASE_URL` - The base URL for the Laravel API backend

## Development Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

The app will now use `http://localhost:8000/api` for API calls.

## Production Setup

### Option 1: Build-time Environment Variable

1. **Create `.env.production` file:**
   ```env
   VITE_API_BASE_URL=https://api.tipsstars.com/api
   ```

2. **Build with production environment:**
   ```bash
   npm run build
   ```

### Option 2: Environment Variable During Build

Set the environment variable when building:

```bash
VITE_API_BASE_URL=https://api.tipsstars.com/api npm run build
```

### Option 3: Default Production URL

If no environment variable is set, the app defaults to:
```
https://api.tipsstars.com/api
```

This is configured in `src/services/api.ts`.

## How It Works

1. **Development:**
   - Uses `.env` file with `VITE_API_BASE_URL=http://localhost:8000/api`
   - Automatically loaded by Vite dev server

2. **Production:**
   - Environment variables are embedded at build time
   - Set `VITE_API_BASE_URL` before running `npm run build`
   - Or rely on the default production URL

## File Structure

```
pweza-admin/
├── .env                 # Development environment (gitignored)
├── .env.example         # Example file (committed to git)
├── .env.production      # Production environment (optional, gitignored)
└── src/
    └── services/
        └── api.ts       # Uses import.meta.env.VITE_API_BASE_URL
```

## Important Notes

- ⚠️ **Never commit `.env` files** - They are in `.gitignore`
- ✅ **Commit `.env.example`** - This serves as a template
- 🔄 **Restart dev server** after changing `.env` file
- 🏗️ **Rebuild** after changing production environment variables

## Troubleshooting

### API calls going to wrong URL

1. Check `.env` file exists and has correct value
2. Restart the dev server: `npm run dev`
3. Clear browser cache
4. Check browser console for actual API calls

### Production build using wrong URL

1. Verify environment variable is set before build
2. Check built files in `dist/` folder
3. Rebuild with explicit environment variable:
   ```bash
   VITE_API_BASE_URL=https://api.tipsstars.com/api npm run build
   ```

## Deployment Checklist

- [ ] Create `.env.production` with production API URL
- [ ] Build with production environment: `npm run build`
- [ ] Verify `dist/` folder contains correct API URLs
- [ ] Test API connectivity from production site
- [ ] Ensure CORS is configured on backend for production domain

