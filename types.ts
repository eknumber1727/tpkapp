// FIX: Use Firebase compat Timestamp type to align with the rest of the project.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export type CategoryName = string;

export interface Category {
  id: string;
  name: CategoryName;
}

export interface Language {
  id: string;
  name: string;
}

export enum SubmissionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export type AspectRatio = '4:5' | '1:1' | '9:16' | '16:9' | '3:4';

// Data Models - Raw from Firestore (uses Timestamp)
export interface UserFromFirestore {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  photo_url: string;
  role: Role;
  password?: string;
  creator_id: string;
  created_at: firebase.firestore.Timestamp;
  lastUsernameChangeAt: firebase.firestore.Timestamp | null;
  fcmTokens?: string[];
}

// Data Models - Used in App State (uses string for dates)
export interface User {
  id: string; // user email or UUID
  name: string;
  email: string;
  emailVerified: boolean;
  photo_url: string;
  role: Role;
  password?: string;
  creator_id: string; // Unique, user-facing ID
  created_at: string; // ISO Date string
  lastUsernameChangeAt: string | null; // ISO Date string
  fcmTokens?: string[];
}

export interface Template {
  id: string;
  title: string;
  category: CategoryName;
  language: string;
  tags: string[];
  
  png_url: string;
  bg_preview_url: string;
  composite_preview_url: string;
  
  status: SubmissionStatus;
  is_active: boolean;
  
  ratio_default: AspectRatio;
  ratios_supported: AspectRatio[];
  
  uploader_id: string;
  uploader_username: string;
  created_at: string; // ISO Date string
  downloadCount?: number;
  likeCount?: number;
}

export interface Bookmark {
    id: string;
    user_id: string;
    template_id: string;
    created_at: string; // ISO Date string
}

export interface Like {
    id: string;
    user_id: string;
    template_id: string;
    created_at: string; // ISO Date string
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
    updated_at: string; // ISO Date string
}

export interface Download {
    id: string;
    user_id: string;
    template_id: string;
    design_id: string | null;
    file_url?: string;
    local_only: boolean;
    timestamp: string; // ISO Date string
    thumbnail?: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string; // ISO Date string
}

export interface AppSettings {
  aboutUs: string;
  terms: string;
  contactEmail: string;
  adsEnabled: boolean;
  adSensePublisherId: string;
  adSenseSlotId: string;
  faviconUrl: string;
  featuredTemplates?: string[];
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  sent_at: string; // ISO Date string
}