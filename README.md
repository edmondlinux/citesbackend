
# CITES Backend API

This is the backend API for the CITES permit application system.

## Features

- RESTful API for permit applications
- File upload handling via Cloudinary
- Email notifications
- Form validation
- Error handling and logging

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - Cloudinary credentials for file uploads
   - SMTP settings for email notifications (optional)

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

- `POST /api/permits/apply` - Submit permit application
- `GET /api/permits/:id/status` - Get permit status
- `POST /api/uploads/documents` - Upload documents
- `GET /api/health` - Health check

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SMTP_*` - Email configuration (optional)

## Data Storage

Currently uses JSON file storage in the `data` directory. In production, this should be replaced with a proper database.
