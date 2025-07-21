# HIMS Backend API

Backend API for HIMS College Application System built with Node.js, Express, and PostgreSQL.

## Features

- Student application management
- Admin authentication and authorization
- File uploads with Cloudinary
- Content management (hero slides, teachers, students)
- RESTful API endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Sequelize
- **File Storage**: Cloudinary
- **Authentication**: JWT
- **Deployment**: Vercel

## API Endpoints

### Applications
- `POST /api/applications` - Submit new application
- `GET /api/applications` - Get all applications (admin only)
- `GET /api/applications/:id` - Get single application (admin only)
- `PATCH /api/applications/:id` - Update application status (admin only)

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/applications` - Get applications with pagination
- `GET /api/admin/statistics` - Get application statistics
- `POST /api/admin/setup` - Setup admin account

### Content
- `GET /api/content/hero-slides` - Get hero slides
- `GET /api/content/teachers` - Get teachers
- `GET /api/content/students` - Get students

## Deployment to Vercel

### Prerequisites

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

### Deployment Steps

1. **Clone and setup the project**:
   ```bash
   git clone <your-repo-url>
   cd hims-backend
   npm install
   ```

2. **Setup admin account** (optional - for initial setup):
   ```bash
   npm run setup
   ```

3. **Seed initial data** (optional):
   ```bash
   npm run seed
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Environment Configuration

All environment variables are hardcoded in `config/production.js` for production deployment. The following configurations are included:

- **Database**: Neon PostgreSQL connection
- **JWT Secret**: Authentication secret
- **Cloudinary**: File upload configuration
- **Admin Credentials**: Default admin account

### Vercel Configuration

The project includes a `vercel.json` file configured for:
- Serverless function deployment
- API route handling
- Function timeout settings
- Environment variables

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Setup admin account**:
   ```bash
   npm run setup
   ```

4. **Seed data** (optional):
   ```bash
   npm run seed
   ```

## API Documentation

### Authentication

Most admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### File Uploads

File uploads are handled through Cloudinary. Supported formats:
- Images: JPG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX

### Response Format

All API responses follow this format:

```json
{
  "status": "success",
  "data": {...},
  "message": "Operation completed successfully"
}
```

## Security Notes

- All sensitive data is hardcoded in production config
- JWT tokens expire after 24 hours
- File uploads are validated and sanitized
- Database connections use SSL

## Support

For issues or questions, please contact the development team. 