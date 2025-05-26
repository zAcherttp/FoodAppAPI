# Food App API Endpoints Documentation

This document provides a comprehensive reference of all API endpoints available in the Food App API, including their localhost URLs for testing and development purposes.

## Base URL

For local development, the API runs on:

```
http://localhost:3000
```

## Authentication Endpoints

### Signup

- **URL**: `http://localhost:3000/api/auth/signup`
- **Method**: `POST`
- **Description**: Register a new user
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns the created user object with JWT token

### Login

- **URL**: `http://localhost:3000/api/auth/login`
- **Method**: `POST`
- **Description**: Authenticate a user and create a new session
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns user information and JWT token

### Logout

- **URL**: `http://localhost:3000/api/auth/logout`
- **Method**: `POST`
- **Description**: Invalidate the current session
- **Authentication**: Required
- **Response**: Success message

### Forgot Password

- **URL**: `http://localhost:3000/api/auth/forgot-password`
- **Method**: `POST`
- **Description**: Request a password reset email
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: Success message with instructions

### Verify OTP

- **URL**: `http://localhost:3000/api/auth/verify-otp`
- **Method**: `POST`
- **Description**: Verify one-time password for password reset
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response**: Success message with reset token

### Reset Password

- **URL**: `http://localhost:3000/api/auth/reset-password`
- **Method**: `PATCH`
- **Description**: Reset user password using token
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "token": "reset_token",
    "password": "newpassword123"
  }
  ```
- **Response**: Success message

### Get User Sessions

- **URL**: `http://localhost:3000/api/auth/sessions`
- **Method**: `GET`
- **Description**: Get all active sessions for current user
- **Authentication**: Required
- **Response**: List of active sessions with device information

## User Endpoints

### Get Current User Profile

- **URL**: `http://localhost:3000/api/users/me`
- **Method**: `GET`
- **Description**: Get the current user's profile
- **Authentication**: Required
- **Response**: User profile data

### Update User Profile

- **URL**: `http://localhost:3000/api/users/update-profile`
- **Method**: `PATCH`
- **Description**: Update the current user's profile information
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "Updated Name"
  }
  ```
- **Response**: Updated user profile

### Update Password

- **URL**: `http://localhost:3000/api/users/update-password`
- **Method**: `PATCH`
- **Description**: Update the current user's password
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }
  ```
- **Response**: Success message

### Delete Account

- **URL**: `http://localhost:3000/api/users/delete-account`
- **Method**: `DELETE`
- **Description**: Delete the current user's account and all associated data
- **Authentication**: Required (token only)
- **Request Body**: None required
- **Response**: Success message

### Get User by ID

- **URL**: `http://localhost:3000/api/users/user/:id`
- **Method**: `GET`
- **Description**: Get a user's profile by their ID
- **Authentication**: Required
- **Response**: User profile data

### Upload Avatar

- **URL**: `http://localhost:3000/api/users/upload-avatar`
- **Method**: `POST`
- **Description**: Upload profile avatar image
- **Authentication**: Required
- **Request Body**: Form data with file
- **Response**: URL of uploaded avatar

### Save Recipe

- **URL**: `http://localhost:3000/api/users/save-recipe`
- **Method**: `POST`
- **Description**: Save a recipe to user's collection
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "recipeId": "recipe-uuid"
  }
  ```
- **Response**: Saved recipe data

### Get Saved Recipes

- **URL**: `http://localhost:3000/api/users/saved-recipes`
- **Method**: `GET`
- **Description**: Get all saved recipes for current user
- **Authentication**: Required
- **Response**: List of saved recipes

### Remove Saved Recipe

- **URL**: `http://localhost:3000/api/users/saved-recipes/:recipeId`
- **Method**: `DELETE`
- **Description**: Remove a recipe from saved collection
- **Authentication**: Required
- **Response**: Success message

### Get User Sessions

- **URL**: `http://localhost:3000/api/users/sessions`
- **Method**: `GET`
- **Description**: Get all active sessions for current user
- **Authentication**: Required
- **Response**: List of active sessions

### Invalidate Session

- **URL**: `http://localhost:3000/api/users/sessions/:sessionId`
- **Method**: `DELETE`
- **Description**: Invalidate a specific session (logout from a device)
- **Authentication**: Required
- **Response**: Success message

## Recipe Endpoints

### Add Recipe

- **URL**: `http://localhost:3000/api/recipes/add-recipe`
- **Method**: `POST`
- **Description**: Create a new recipe
- **Authentication**: Required
- **Request Body**: Form data with recipe details and image
- **Response**: Created recipe data

### Get Recipes by Title

- **URL**: `http://localhost:3000/api/recipes/get-recipe-title`
- **Method**: `GET`
- **Description**: Search for recipes by title
- **Authentication**: Required
- **Query Parameters**: `title` - Recipe title to search for
- **Response**: List of matching recipes

### Get Latest Recipes

- **URL**: `http://localhost:3000/api/recipes/get-recipe-latest`
- **Method**: `GET`
- **Description**: Get most recently added recipes
- **Authentication**: Required
- **Query Parameters**: `limit` - Number of recipes to return (optional)
- **Response**: List of recipes sorted by creation date

### Get Recipe by ID

- **URL**: `http://localhost:3000/api/recipes/get-recipe-id`
- **Method**: `GET`
- **Description**: Get a recipe by its ID
- **Authentication**: Required
- **Query Parameters**: `id` - Recipe ID
- **Response**: Recipe data

### Get Recipes by Author

- **URL**: `http://localhost:3000/api/recipes/get-recipe-author`
- **Method**: `GET`
- **Description**: Get recipes created by a specific user
- **Authentication**: Required
- **Query Parameters**: `authorId` - User ID of the author
- **Response**: List of recipes by the author

### Get Random Recipes

- **URL**: `http://localhost:3000/api/recipes/get-random-recipe`
- **Method**: `GET`
- **Description**: Get random recipes
- **Authentication**: Required
- **Query Parameters**: `count` - Number of random recipes to return
- **Response**: List of random recipes

### Comment on Recipe

- **URL**: `http://localhost:3000/api/recipes/comment-recipe`
- **Method**: `PATCH`
- **Description**: Add a comment to a recipe
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "recipeId": "recipe-uuid",
    "content": "This recipe is amazing!"
  }
  ```
- **Response**: Comment data

### Get Recipe Comments

- **URL**: `http://localhost:3000/api/recipes/get-recipe-comments`
- **Method**: `GET`
- **Description**: Get all comments for a recipe
- **Authentication**: Required
- **Query Parameters**: `recipeId` - Recipe ID
- **Response**: List of comments for the recipe

### Rate Recipe

- **URL**: `http://localhost:3000/api/recipes/rating-recipe`
- **Method**: `PATCH`
- **Description**: Rate a recipe
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "recipeId": "recipe-uuid",
    "rating": 4.5
  }
  ```
- **Response**: Rating data

### Get Recipe Rating

- **URL**: `http://localhost:3000/api/recipes/get-recipe-rating`
- **Method**: `GET`
- **Description**: Get average rating for a recipe
- **Authentication**: Required
- **Query Parameters**: `recipeId` - Recipe ID
- **Response**: Average rating and count of ratings

### Like Comment

- **URL**: `http://localhost:3000/api/recipes/like-comment`
- **Method**: `PATCH`
- **Description**: Like a comment on a recipe
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "commentId": "comment-uuid"
  }
  ```
- **Response**: Updated comment data

### Dislike Comment

- **URL**: `http://localhost:3000/api/recipes/dislike-comment`
- **Method**: `PATCH`
- **Description**: Dislike a comment on a recipe
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "commentId": "comment-uuid"
  }
  ```
- **Response**: Updated comment data

### Upload Recipe Image

- **URL**: `http://localhost:3000/api/recipes/upload-image`
- **Method**: `POST`
- **Description**: Upload an image for a recipe
- **Authentication**: Required
- **Request Body**: Form data with image file
- **Response**: URL of uploaded image

### Delete Recipe

- **URL**: `http://localhost:3000/api/recipes/:recipeId`
- **Method**: `DELETE`
- **Description**: Delete a recipe (only the author can delete their own recipe)
- **Authentication**: Required
- **Response**: Success message

## Comment Endpoints

### Add Comment

- **URL**: `http://localhost:3000/api/comments/add`
- **Method**: `POST`
- **Description**: Add a comment to a recipe
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "recipeId": "recipe-uuid",
    "content": "This recipe is amazing!"
  }
  ```
- **Response**: Comment data

### Get Recipe Comments

- **URL**: `http://localhost:3000/api/comments/recipe/:recipeId`
- **Method**: `GET`
- **Description**: Get all comments for a specific recipe
- **Authentication**: None
- **Response**: List of comments for the recipe

### Like Comment

- **URL**: `http://localhost:3000/api/comments/like`
- **Method**: `POST`
- **Description**: Like a comment
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "commentId": "comment-uuid"
  }
  ```
- **Response**: Updated comment data

### Dislike Comment

- **URL**: `http://localhost:3000/api/comments/dislike`
- **Method**: `POST`
- **Description**: Dislike a comment
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "commentId": "comment-uuid"
  }
  ```
- **Response**: Updated comment data

### Delete Comment

- **URL**: `http://localhost:3000/api/comments/:commentId`
- **Method**: `DELETE`
- **Description**: Delete a comment
- **Authentication**: Required (must be comment author)
- **Response**: Success message

## Rating Endpoints

### Rate Recipe

- **URL**: `http://localhost:3000/api/ratings/rate`
- **Method**: `POST`
- **Description**: Rate a recipe
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "recipeId": "recipe-uuid",
    "rating": 4.5
  }
  ```
- **Response**: Rating data

### Get Recipe Rating

- **URL**: `http://localhost:3000/api/ratings/recipe/:recipeId`
- **Method**: `GET`
- **Description**: Get average rating for a recipe
- **Authentication**: None
- **Response**: Average rating and count of ratings

### Delete Rating

- **URL**: `http://localhost:3000/api/ratings/recipe/:recipeId`
- **Method**: `DELETE`
- **Description**: Delete user's rating for a recipe
- **Authentication**: Required
- **Response**: Success message

## Notification Endpoints

### Get User Notifications

- **URL**: `http://localhost:3000/api/notifications`
- **Method**: `GET`
- **Description**: Get all notifications for the current user
- **Authentication**: Required
- **Response**: List of notifications with sender information

### Mark Notification as Read

- **URL**: `http://localhost:3000/api/notifications/:notificationId/read`
- **Method**: `PATCH`
- **Description**: Mark a specific notification as read
- **Authentication**: Required
- **Response**: Success message

### Mark All Notifications as Read

- **URL**: `http://localhost:3000/api/notifications/read-all`
- **Method**: `PATCH`
- **Description**: Mark all user's notifications as read
- **Authentication**: Required
- **Response**: Success message

### Delete Notification

- **URL**: `http://localhost:3000/api/notifications/:notificationId`
- **Method**: `DELETE`
- **Description**: Delete a specific notification
- **Authentication**: Required
- **Response**: Success message

## AI Endpoints

### Vector Search

- **POST** `/ai/search`
- **Description**: Vector-based recipe search
- **Body**:

```json
{
  "searchQuery": {
    "title": string,
    "author": string,
    "tags": string[],
    "ingredients": string[],
    "instructions": string[],
    "time": string
  },
  "searchOptions": {
    "similarity_threshold": float,
    "match_limit": int,
    "include_tags": string[],
    "exclude_tags": string[],
    "min_rating": float,
    "max_time_minutes": int,
    "dietary_restrictions": string[]
  }
}
```

- **Response**: Search results with similarity scores

### Image Search

- **POST** `/ai/search-image`
- **Description**: Extract ingredients from image and search
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `image` file
- **Response**: Extracted ingredients and recipe suggestions

### Recipe Suggestions

- **POST** `/ai/suggest-recipes`
- **Description**: Get AI recipe suggestions from ingredients
- **Body**:

```json
{
  "ingredients": ["string"]
}
```

- **Response**: Array of AI-generated recipe objects

## Real-time Notifications

The API supports real-time notifications using Socket.IO. Users can receive instant notifications when:

1. Someone comments on their recipe
2. Someone rates their recipe
3. Other important events related to their content

### Socket.IO Events

- **authenticate** - Connect with JWT token

  ```javascript
  socket.emit("authenticate", jwtToken);
  ```

- **authenticated** - Successful authentication confirmation

  ```javascript
  socket.on("authenticated", (data) => {
    console.log(`Connected as user ${data.userId}`);
  });
  ```

- **authentication_error** - Authentication failure

  ```javascript
  socket.on("authentication_error", (error) => {
    console.error(`Authentication error: ${error}`);
  });
  ```

- **new_notification** - Receive a new notification
  ```javascript
  socket.on("new_notification", (notification) => {
    console.log("New notification:", notification);
  });
  ```

A demo HTML client is available at: `http://localhost:3000/notification-demo.html`

## Authentication

Most endpoints require authentication, which is implemented using JWT tokens. To authenticate requests, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The JWT token is obtained by logging in or signing up and is valid for 30 days by default.

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "status": "error",
  "message": "Error message describing what went wrong"
}
```

### 400 Bad Request

```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse. Specific limits vary by endpoint type:

- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute

## CORS Policy

The API supports CORS for cross-origin requests from approved domains.
