import { Request } from "express";

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
  interaction_type: "like" | "dislike";
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
export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: "COMMENT" | "RATING" | "LIKE" | "DISLIKE" | string;
  content: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients?: string[];
  instructions?: string[];
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

export interface SearchOptions {
  similarity_threshold?: number;
  match_limit?: number;
  include_tags?: string[];
  exclude_tags?: string[];
  min_rating?: number;
  max_time_minutes?: number;
  dietary_restrictions?: string[];
}
export interface SearchQuery {
  title?: string;
  author?: string;
  tags?: string[];
  ingredients?: string[];
  instructions?: string[];
  time?: string;
}

export interface RAGResponse {
  recipes: Recipe[];
  refined_answer?: string;
  search_metadata: {
    total_found: number;
    avg_similarity: number;
    search_time_ms: number;
  };
}

export interface ImageExtractionResult {
  suggested_dishes: string[];
  ingredients: string[];
}
