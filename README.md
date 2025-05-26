# NT118.P22 FoodApp - API

## Overview

This repository contains a comprehensive Node.js API with TypeScript for the NT118.P22 Mobile App Development course. The API provides a complete food recipe platform with user authentication, recipe management, social features (comments and ratings), real-time notifications, and AI-powered recipe search and suggestions.

## Features

### User Authentication & Management

- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- Multi-device session management
- Password reset via email with OTP verification
- User profile management with avatar upload
- Account deletion with data cleanup

### Recipe Management

- Create, read, update, and delete recipes
- Recipe image upload and management
- Search recipes by title, author, or ingredients
- Get latest, random, and all recipes
- Save/unsave recipes to personal collection
- Recipe categorization with tags

### Social Features

- Comment system for recipes
- Like/dislike comments
- Recipe rating system (1-5 stars)
- Real-time notifications for recipe interactions
- User-generated content management

### AI-Powered Features

- Vector-based recipe search using embeddings
- Image-to-ingredients recognition
- AI recipe suggestions based on available ingredients
- Intelligent recipe recommendations using Gemini AI
- Natural language recipe queries

### Real-time Features

- Socket.IO integration for live notifications
- Real-time updates for comments and ratings
- User presence and activity tracking

### Security & Performance

- JWT-based authentication with session tracking
- Input validation and sanitization
- File upload security with image optimization
- Rate limiting and error handling
- Automatic session cleanup

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcrypt
- **File Storage**: Multer with Sharp for image processing
- **AI Services**: Google Gemini AI, Hugging Face Transformers
- **Real-time**: Socket.IO
- **Email**: Resend service
- **Vector Search**: Snowflake Arctic embeddings

## Project Structure

```
FoodAppAPI/
├── src/
│   ├── config/
│   │   ├── supabase.ts          # Supabase client configuration
│   │   └── gemini.ts            # Gemini AI configuration
│   ├── controllers/
│   │   ├── authController.ts    # Authentication logic
│   │   ├── userController.ts    # User management
│   │   ├── recipeController.ts  # Recipe CRUD operations
│   │   ├── recipeControllerBridge.ts # Bridge for legacy routes
│   │   ├── commentController.ts # Comment management
│   │   ├── ratingController.ts  # Rating system
│   │   ├── notificationController.ts # Notification system
│   │   └── aiController.ts      # AI-powered features
│   ├── middleware/
│   │   ├── authMiddleware.ts    # Authentication protection
│   │   └── fileUpload.ts       # File upload handling
│   ├── routes/
│   │   ├── authRoutes.ts        # Authentication endpoints
│   │   ├── userRoutes.ts        # User management endpoints
│   │   ├── recipeRoutes.ts      # Recipe endpoints
│   │   ├── commentRoutes.ts     # Comment endpoints
│   │   ├── ratingRoutes.ts      # Rating endpoints
│   │   ├── notificationRoutes.ts # Notification endpoints
│   │   └── aiRoutes.ts          # AI endpoints
│   ├── services/
│   │   ├── emailService.ts      # Email service
│   │   ├── socketService.ts     # Real-time notifications
│   │   └── aiService.ts         # AI recipe assistant
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── dataNormalization.ts # Data processing utilities
│   └── server.ts                # Express app setup and server startup
├── public/                      # Static files and uploads
├── docs/
│   ├── API_ENDPOINTS.md         # API endpoint documentation
│   └── DATABASE_SCHEMA.md       # Database schema documentation
├── implementation-guide.md      # Feature integration guide
├── package.json                 # Project dependencies
└── tsconfig.json                # TypeScript configuration
```

## Documentation

- **API Endpoints**: [API_ENDPOINTS.md](docs/ENDPOINTS.md)
- **Database Schema**: [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- **Implementation Guide**: [implementation-guide.md](docs/implementation-guide.md)

## Setup and Configuration

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- Supabase account
- Google AI API key
- Email service (Resend) account

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd FoodAppAPI
```

2. Install dependencies

```bash
pnpm install
```

3. Create environment file

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=90d

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Session Management
SESSION_CLEANUP_INTERVAL=1440  # minutes
```

5. Set up database

- Create a Supabase project
- Run the database migrations (see [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md))
- Enable Row Level Security (RLS) policies as needed

6. Start development server

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`

## AI Features

### Vector Search

- Uses Snowflake Arctic embeddings for semantic recipe search
- Supports natural language queries
- Implements similarity-based matching

### Image Recognition

- Extracts ingredients from food images
- Suggests recipes based on identified ingredients
- Uses Google Gemini Vision API

### Recipe Generation

- AI-powered recipe suggestions
- Customizable based on available ingredients

## Testing & Development

### Running Tests

```bash
pnpm test
```

### Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
```

## Deployment

### Environment Setup

1. Set all required environment variables
2. Configure database with proper indexes and RLS policies
3. Set up file storage for recipe images and avatars
4. Configure email service for password resets

### Production Considerations

- Enable HTTPS for secure JWT transmission
- Set up proper CORS policies
- Configure rate limiting
- Monitor AI API usage and costs
- Set up logging and error tracking
- Configure automated backups

### Hosting Platforms

- **Database**: Supabase (managed PostgreSQL with vector support)
- **File Storage**: Supabase Storage or AWS S3
- **Email**: Resend or SendGrid

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
