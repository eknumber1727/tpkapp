// Fix: Add ImportMeta interface to support import.meta.env for Vite
interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID: string;
    readonly VITE_FIREBASE_MESSAGING_VAPID_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// This informs TypeScript that a global `firebase` object exists.
declare const firebase: any;

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

// Data Models - Raw from Firestore (uses Timestamp)
export interface UserFromFirestore {
  id: string;
  name: string;
  email: string;
  photo_url: string;
  role: Role;
  password?: string;
  creator_id: string;
  created_at: any; // firebase.firestore.Timestamp;
  lastUsernameChangeAt: any | null; // firebase.firestore.Timestamp | null;
  fcmTokens?: string[];
}

// Data Models - Used in App State (uses string for dates)
export interface User {
  id: string; // user email or UUID
  name: string;
  email: string;
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
  downloadCount: number;
  likeCount: number;
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

// Represents the entire state of the editor canvas
export interface SavedDesignData {
    bgMedia: {
        src: string;
        type: 'image' | 'video';
        scale: number;
        x: number;
        y: number;
    };
}

export interface SavedDesign {
    id: string;
    user_id: string;
    template_id: string;
    ratio: AspectRatio;
    layers_json: SavedDesignData;
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
  adsEnabled: boolean; // Reverted but kept for AdBanner to not crash
  adSensePublisherId: string;
  adSenseSlotId: string;
  // Fix: Add missing properties to AppSettings type.
  faviconUrl?: string;
  watermarkEnabled: boolean;
  watermarkText: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  sent_at: string; // ISO Date string
}
