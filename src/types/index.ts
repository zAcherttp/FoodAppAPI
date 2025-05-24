import { Request } from 'express';

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    password_reset_token?: string | null;
    password_reset_expires?: string | null;
    date_of_birth?: string | null;
    country?: string | null;
    created_at?: string;
    updated_at?: string;
    url_avatar?: string | null;
    saved_recipes?: string[] | null;
  }
  
  export interface Session {
    id: string;
    user_id: string;
    token?: string;
    user_agent?: string;
    ip_address?: string;
    is_valid: boolean;
    expires_at: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface DecodedToken {
    id: string;
    sessionId: string;
    iat: number;
    exp: number;
  }
  
  export interface EmailOptions {
    email: string;
    subject: string;
    message?: string;
    text?: string;
    html?: string;
  }
  
  export interface RequestWithUser extends Request {
    user?: {
      id: string;
      name: string;
      email: string;
      // Add other user properties if needed
    };
    params: any;
    headers: any;
    session?: Session;
    body: any;
  }

  export interface Comment {
    id: string;
    recipe_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at?: string;
    likes: number;
    dislikes: number;
    // These fields are for frontend use and will be computed at runtime
    userLiked?: boolean;
    userDisliked?: boolean;
  }

  export interface CommentInteraction {
    id: string;
    comment_id: string;
    user_id: string;
    interaction_type: 'like' | 'dislike';
    created_at: string;
  }

  export interface Rating {
    id: string;
    recipe_id: string;
    user_id: string;
    rating: number;
    created_at: string;
    updated_at?: string;
  }

  export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    image_url?: string;
    author?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
    time?: string;
    // These will be populated from separate tables as needed
    comments_count?: number;
    average_rating?: number;
    embedding?: number[];
  }