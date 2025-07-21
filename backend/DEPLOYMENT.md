# Vercel Production Deployment Guide

## Changes Made for Production

### 1. Environment Variables Removed
- ✅ Removed `dotenv` dependency from `package.json`
- ✅ Created `config/production.js` with hardcoded configuration
- ✅ Updated all files to use production config instead of environment variables

### 2. Files Updated
- ✅ `config/database.js` - Uses production config
- ✅ `utils/cloudinary.js` - Uses production config
- ✅ `middleware/auth.js` - Uses production config
- ✅ `routes/admin.js` - Uses production config
- ✅ `setup-admin.js` - Uses production config
- ✅ `api/index.js` - Removed dotenv dependency
- ✅ `test-api.js` - Updated base URL

### 3. Vercel Configuration
- ✅ Updated `vercel.json` for production deployment
- ✅ Added function timeout settings
- ✅ Optimized build configuration

### 4. Security & Best Practices
- ✅ Created `.gitignore` to exclude sensitive files
- ✅ Added `serverless-http` dependency
- ✅ Created comprehensive `README.md`
- ✅ Created deployment script `deploy.sh`

## Production Configuration

All sensitive data is now hardcoded in `config/production.js`:

```javascript
const config = {
  database: {
    host: 'ep-autumn-darkness-adbsao3t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    name: 'neondb',
    user: 'neondb_owner',
    password: 'npg_WzwxXjSA39Lu',
    ssl: 'require'
  },
  jwt: {
    secret: 'hims_college_jwt_secret_key_2024'
  },
  admin: {
    email: 'hims@gmail.com',
    password: 'hims123'
  },
  cloudinary: {
    cloudName: 'dwtru703l',
    apiKey: '964741116272599',
    apiSecret: 'QckGC-axVOaemElOzmt50-rDepA'
  }
};
```

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Admin Account (Optional)
```bash
npm run setup
```

### 5. Seed Data (Optional)
```bash
npm run seed
```

### 6. Deploy to Vercel
```bash
vercel --prod
```

### 7. Update Test Configuration
After deployment, update the `BASE_URL` in `test-api.js` with your actual Vercel URL.

## API Endpoints

### Public Endpoints
- `GET /` - Health check
- `GET /api` - API health check
- `POST /api/applications` - Submit application
- `GET /api/content/hero-slides` - Get hero slides
- `GET /api/content/teachers` - Get teachers
- `GET /api/content/students` - Get students

### Protected Endpoints (Require JWT Token)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/applications` - Get applications
- `GET /api/admin/applications/:id` - Get single application
- `PATCH /api/admin/applications/:id` - Update application
- `GET /api/admin/statistics` - Get statistics

## Authentication

Admin login endpoint:
```bash
POST /api/admin/login
Content-Type: application/json

{
  "email": "hims@gmail.com",
  "password": "hims123"
}
```

Include JWT token in protected requests:
```bash
Authorization: Bearer <your-jwt-token>
```

## Testing

1. Update `test-api.js` with your Vercel URL
2. Run the test script:
```bash
node test-api.js
```

## Monitoring

- Vercel dashboard provides logs and monitoring
- Database connections are managed by Neon
- File uploads are handled by Cloudinary

## Security Notes

⚠️ **Important**: The current configuration has hardcoded sensitive data. For production use, consider:

1. Using Vercel environment variables for sensitive data
2. Rotating JWT secrets regularly
3. Implementing rate limiting
4. Adding input validation and sanitization
5. Using HTTPS for all communications

## Support

For deployment issues:
1. Check Vercel logs in the dashboard
2. Verify database connectivity
3. Test API endpoints individually
4. Check Cloudinary configuration

## Next Steps

1. Deploy to Vercel using the steps above
2. Test all API endpoints
3. Update frontend to use the new API URL
4. Monitor performance and logs
5. Set up monitoring and alerts 