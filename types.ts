export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export type CategoryName = string;

export interface Category {
  id: string;
  name: CategoryName;
}

export enum SubmissionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export type AspectRatio = '4:5' | '1:1' | '9:16' | '16:9' | '3:4';

// Data Models
export interface User {
  id: string; // user email or UUID
  name: string;
  photo_url: string;
  role: Role;
  password?: string;
  creator_id: string; // Unique, user-facing ID
  created_at: string;
  lastUsernameChangeAt: string | null; // ISO Date string
}

export interface Template {
  id: string;
  title: string;
  category: CategoryName;
  language: string;
  tags: string[];
  
  png_url: string; // REQUIRED: transparent PNG (no background)
  bg_preview_url: string; // REQUIRED: preview background image
  composite_preview_url: string; // AUTO: server/app merges png_url over bg_preview_url
  
  status: SubmissionStatus;
  is_active: boolean;
  
  ratio_default: AspectRatio;
  ratios_supported: AspectRatio[];
  
  uploader_id: string;
  uploader_username: string;
  created_at: string;

  // Optional/Future fields from spec
  thumbnail_url?: string;
  has_transparency?: boolean;
  approved_by?: string;
  published_at?: string;
  views?: number;
  creates?: number;
  downloads?: number;
  bookmarks?: number;
}

export interface Bookmark {
    id: string;
    user_id: string;
    template_id: string;
    created_at: string;
}

export interface SavedDesignLayer {
    bgMediaUrl: string;
    bgType: 'image' | 'video';
    scale: number;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    extraTexts: {
        text: string;
        font: string;
        size: number;
        color: string;
        x: number;
        y: number;
    }[];
}

export interface SavedDesign {
    id: string;
    user_id: string;
    template_id: string;
    ratio: AspectRatio;
    layers_json: SavedDesignLayer;
    updated_at: string;
}

export interface Download {
    id: string;
    user_id: string;
    template_id: string;
    design_id: string | null;
    file_url?: string;
    local_only: boolean;
    timestamp: string;
    thumbnail?: string; // Storing a thumbnail of the download for the UI
}

export interface Suggestion {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface AppSettings {
  aboutUs: string;
  terms: string;
  contactEmail: string;
}