# NT118.P22 FoodApp - API

## Overview
This repository contains a Node.js API with TypeScript that implements a basic user authentication system for the NT118.P22 Mobile App Development course. The API provides secure user management with features like registration, login, session management, password reset, and multi-device session handling.

## Features

### User Authentication
- Sign up with name, email, and password
- Login with email and password
- JWT-based authentication
- Secure password hashing with bcrypt
- Session management across multiple devices

### Session Management
- Track active user sessions with device information
- View all active sessions for a user
- Invalidate specific sessions (logout from specific devices)
- Automatic cleanup of expired sessions

### Password Management
- Forgot password functionality
- Secure password reset via email with time-limited tokens

### Security
- Token-based authentication with JWT
- Password hashing with bcrypt
- Session tracking with IP and user agent information
- Token validation and session expiration

## Tech Stack
- Node.js - JavaScript runtime
- Express - Web framework
- TypeScript - Type safety
- Supabase - Database for storing user data and sessions
- Resend - Email delivery service

## Project Structure
```
FoodAppAPI/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   └── authController.ts    # Authentication logic
│   ├── middleware/
│   │   └── authMiddleware.ts    # Authentication protection middleware
│   ├── routes/
│   │   └── authRoutes.ts        # Authentication API routes
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── emailService.ts      # Email service for password reset
│   └── server.ts                # Express app setup and server startup
├── package.json                 # Project dependencies
└── tsconfig.json                # TypeScript configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and create a session
- `POST /api/auth/logout` - Logout and invalidate current session
- `POST /api/auth/forgot-password` - Request password reset email
- `PATCH /api/auth/reset-password/:token` - Reset password with token

### User Profile
- `GET /api/auth/me` - Get current user profile

### Session Management
- `GET /api/auth/sessions` - Get all active sessions for current user
- `DELETE /api/auth/sessions/:sessionId` - Invalidate a specific session

## Setup and Configuration
1. Clone the repository
2. Install dependencies with `pnpm i`
3. Create a `.env` file with the following variables:
```
JWT_SECRET=your_jwt_secret_key_here  # Secret key for signing JWTs
JWT_EXPIRES_IN=30d                   # JWT token expiration time

PORT=3000                            # API server port
NODE_ENV=development                 # Environment (development/production)

SUPABASE_URL=your_supabase_url       # Supabase project URL
SUPABASE_ANON_KEY=your_anon_key      # Supabase anonymous key

EMAIL_HOST=smtp.example.com          # SMTP server for sending emails
EMAIL_PORT=465                       # SMTP port
EMAIL_USERNAME=your_email_username   # SMTP username
EMAIL_PASSWORD=your_email_password   # SMTP password
EMAIL_FROM=noreply@example.com       # Sender email address

SESSION_CLEANUP_INTERVAL=1440        # Interval in minutes for cleaning expired sessions
```
4. Start the development server with `pnpm dev`


## Database Schema
The API uses Supabase with the following tables:

### users

| Column | Type | Description |
|--------|------|-------------|
| id | string | Primary key |
| name | string | User's full name |
| email | string | User's email address (unique) |
| password | string | Hashed password |
| password_reset_token | string \| null | Token for password reset |
| password_reset_expires | string \| null | Expiration timestamp for reset token |
| created_at | string \| null | Account creation timestamp |
| updated_at | string \| null | Last update timestamp |

### sessions

| Column | Type | Description |
|--------|------|-------------|
| id | string | Primary key |
| user_id | string | Foreign key to users.id |
| token | string \| null | JWT token |
| user_agent | string \| null | Browser/device information |
| ip_address | string \| null | User's IP address |
| is_valid | boolean \| null | Session validity status |
| expires_at | string | Session expiration timestamp |
| created_at | string \| null | Session creation timestamp |
| updated_at | string \| null | Last update timestamp |

#### Relationships
- `sessions.user_id` references `users.id` (many-to-one)

## Testing
The API can be tested using Postman with test scripts to verify successful authentication and check response data format.

## Deployment
This API can be deployed to any Node.js hosting platform like Heroku, Vercel, or a custom server. Make sure to set all required environment variables on the hosting platform.