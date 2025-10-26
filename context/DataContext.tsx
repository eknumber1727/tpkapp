import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, SubmissionStatus } from '../types';
import type { User, Template, Bookmark, SavedDesign, Download, Category, CategoryName, Suggestion, AppSettings, UserFromFirestore, Notification, Like, SavedDesignData } from '../types';
import firebase, { auth, db, storage, messaging } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';

interface DataContextType {
  // State
  users: User[];
  templates: Template[]; // All templates for users and admin
  bookmarks: Bookmark[];
  bookmarkedTemplates: Template[]; // Specifically fetched bookmarked templates
  likes: Like[];
  savedDesigns: SavedDesign[];
  downloads: Download[];
  categories: Category[];
  suggestions: Suggestion[];
  notifications: Notification[];
  appSettings: AppSettings;
  currentUser: User | null;
  loading: boolean;
  templatesLoading: boolean;
  notificationPermission: NotificationPermission;

  // Auth
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  
  // Templates
  getTemplatesByCreatorId: (creatorId: string) => Promise<Template[]>;


  // User Actions
  getTemplateById: (templateId: string) => Template | undefined;
  getIsBookmarked: (templateId: string) => boolean;
  toggleBookmark: (templateId: string) => Promise<void>;
  getIsLiked: (templateId: string) => boolean;
  toggleLike: (templateId: string) => Promise<void>;
  getSavedDesignById: (designId: string) => SavedDesign | undefined;
  saveDesign: (designData: Omit<SavedDesign, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => Promise<void>;
  addDownload: (downloadData: Omit<Download, 'id' | 'user_id' | 'timestamp'>) => Promise<void>;
  submitTemplate: (submissionData: Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'status' | 'is_active' | 'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  submitSuggestion: (text: string) => Promise<void>;
  subscribeToNotifications: () => Promise<void>;
  generateTags: (title: string, imageFile: File) => Promise<string>;

  // Admin Actions
  adminSubmitTemplate: (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  updateTemplate: (templateId: string, templateData: Partial<Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'created_at' | 'status'>>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  approveTemplate: (templateId: string) => Promise<void>;
  rejectTemplate: (templateId: string) => Promise<void>;
  addCategory: (name: CategoryName) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  sendNotification: (title: string, body: string) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  uploadAdminFile: (file: File | Blob, path: string) => Promise<string>;

  // PWA Install
  installPromptEvent: any | null;
  triggerInstallPrompt: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const storageRef = storage.ref(path);
    await storageRef.put(file);
    return await storageRef.getDownloadURL();
};

const defaultAppSettings: AppSettings = {
    aboutUs: 'Welcome to our app! This content can be edited by the admin.',
    terms: 'Please read our terms and conditions. This content can be edited by the admin.',
    contactEmail: 'contact@example.com',
    adsEnabled: false,
    adSensePublisherId: '',
    adSenseSlotId: '',
    // Fix: Add default values for new AppSettings properties.
    faviconUrl: '',
    watermarkEnabled: false,
    watermarkText: '',
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedTemplates, setBookmarkedTemplates] = useState<Template[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstallPrompt = () => {
      if (!installPromptEvent) return;
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
          } else {
              console.log('User dismissed the install prompt');
          }
          setInstallPromptEvent(null);
      });
  };

  const toISOStringSafe = (timestamp: any): string => {
      if (timestamp && typeof timestamp.toDate === 'function') { // Check for Firestore Timestamp
          return timestamp.toDate().toISOString();
      }
      if (timestamp === null || timestamp === undefined) {
        return new Date().toISOString();
      }
      return timestamp;
  }
  const toISOStringSafeOrNull = (timestamp: any): string | null => {
      if (timestamp && typeof timestamp.toDate === 'function') { // Check for Firestore Timestamp
          return timestamp.toDate().toISOString();
      }
      return null;
  }

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDocRef = db.collection("users").doc(user.uid);
            const userDoc = await userDocRef.get();
            if(userDoc.exists && userDoc.data()){
                const userDataFromDb = userDoc.data() as UserFromFirestore;
                const plainUserObject: User = { 
                    id: user.uid, 
                    name: userDataFromDb.name || 'User',
                    email: userDataFromDb.email || user.email || '',
                    photo_url: userDataFromDb.photo_url || `https://i.pravatar.cc/150?u=${user.uid}`,
                    role: userDataFromDb.role || Role.USER,
                    creator_id: userDataFromDb.creator_id || '',
                    created_at: toISOStringSafe(userDataFromDb.created_at),
                    lastUsernameChangeAt: toISOStringSafeOrNull(userDataFromDb.lastUsernameChangeAt),
                    fcmTokens: userDataFromDb.fcmTokens || []
                };
                setCurrentUser(plainUserObject);
                localStorage.setItem('timepass-katta-user', JSON.stringify(plainUserObject));
            }
        } else {
            setCurrentUser(null);
            localStorage.removeItem('timepass-katta-user');
            setBookmarks([]);
            setSavedDesigns([]);
            setDownloads([]);
            setLikes([]);
            setBookmarkedTemplates([]);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // Initial data loading (non-paginated data)
  useEffect(() => {
    const unsubUsers = db.collection("users").onSnapshot((snapshot) => {
        setUsers(snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                photo_url: data.photo_url,
                role: data.role,
                creator_id: data.creator_id,
                created_at: toISOStringSafe(data.created_at),
                lastUsernameChangeAt: toISOStringSafeOrNull(data.lastUsernameChangeAt),
                fcmTokens: data.fcmTokens || []
            } as User;
        }));
    }, (error) => console.error("Error fetching users:", error));

    const unsubCategories = db.collection("categories").onSnapshot((snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => console.error("Error fetching categories:", error));
    
    const unsubSuggestions = db.collection("suggestions").orderBy("created_at", "desc").onSnapshot((snapshot) => {
        setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at) } as Suggestion)));
    }, (error) => console.error("Error fetching suggestions:", error));

     const unsubNotifications = db.collection("notifications").orderBy("sent_at", "desc").onSnapshot((snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), sent_at: toISOStringSafe(doc.data().sent_at) } as Notification)));
    }, (error) => console.error("Error fetching notifications:", error));

    const unsubAppSettings = db.collection("settings").doc("app").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data() as Partial<AppSettings>;
            setAppSettings({
                ...defaultAppSettings,
                ...data,
            });
        } else {
             setAppSettings(defaultAppSettings);
        }
    }, (error) => console.error("Error fetching app settings:", error));

    const unsubTemplates = db.collection("templates").orderBy("created_at", "desc").onSnapshot((snapshot) => {
        const allTemplates = snapshot.docs.map(doc => ({
            id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
        } as Template));
        setTemplates(allTemplates);
        setTemplatesLoading(false);
    }, (error) => {
        console.error("Error fetching templates:", error);
        setTemplatesLoading(false);
    });

    return () => {
        unsubUsers();
        unsubCategories();
        unsubSuggestions();
        unsubAppSettings();
        unsubNotifications();
        unsubTemplates();
    };
  }, []);
  
  // Per-user data listeners
  useEffect(() => {
    if (!currentUser) {
        setBookmarks([]);
        setSavedDesigns([]);
        setDownloads([]);
        setLikes([]);
        return;
    }
    
    const unsubBookmarks = db.collection("bookmarks").where("user_id", "==", currentUser.id).onSnapshot((snapshot) => {
        setBookmarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at) } as Bookmark)));
    });

    const unsubLikes = db.collection("likes").where("user_id", "==", currentUser.id).onSnapshot((snapshot) => {
        setLikes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at) } as Like)));
    });

    const unsubDesigns = db.collection("savedDesigns").where("user_id", "==", currentUser.id).onSnapshot((snapshot) => {
        setSavedDesigns(snapshot.docs.map(doc => {
            const data = doc.data();
            const layers_json = typeof data.layers_json === 'string' ? JSON.parse(data.layers_json) : data.layers_json;
            return { id: doc.id, ...data, layers_json, updated_at: toISOStringSafe(data.updated_at) } as SavedDesign;
        }));
    });
    
    const unsubDownloads = db.collection("downloads").where("user_id", "==", currentUser.id).onSnapshot((snapshot) => {
        setDownloads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: toISOStringSafe(doc.data().timestamp) } as Download)));
    });

    return () => {
        unsubBookmarks();
        unsubDesigns();
        unsubDownloads();
        unsubLikes();
    };
  }, [currentUser]);

  // Dedicated effect to fetch full bookmarked template data
  useEffect(() => {
    if (!currentUser || bookmarks.length === 0) {
        setBookmarkedTemplates([]);
        return;
    }

    const bookmarkedIds = bookmarks.map(b => b.template_id);
    const fetchPromises: Promise<any>[] = []; 
    for (let i = 0; i < bookmarkedIds.length; i += 10) {
        const chunk = bookmarkedIds.slice(i, i + 10);
        if (chunk.length > 0) {
            fetchPromises.push(db.collection('templates').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get());
        }
    }
    
    Promise.all(fetchPromises).then(snapshots => {
        const fetchedTemplates: Template[] = [];
        snapshots.forEach(snapshot => {
            snapshot.forEach((doc: any) => {
                fetchedTemplates.push({
                    id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
                } as Template);
            });
        });
        setBookmarkedTemplates(fetchedTemplates);
    }).catch(error => {
        console.error("Error fetching bookmarked templates:", error);
    });

  }, [bookmarks, currentUser]);

  const signup = async (name: string, email: string, pass: string): Promise<void> => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    const user = userCredential.user;
    if (!user) {
        throw new Error("Could not create user account.");
    }

    const creator_id = `TK${Date.now().toString().slice(-6)}`;
    const newUser = {
      name,
      email,
      photo_url: `https://i.pravatar.cc/150?u=${user.uid}`,
      role: Role.USER,
      creator_id,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      lastUsernameChangeAt: null,
      fcmTokens: [],
    };
    await db.collection("users").doc(user.uid).set(newUser);
  };
  
  const login = async (email: string, pass: string): Promise<void> => {
    await auth.signInWithEmailAndPassword(email, pass);
  }

  const logout = async () => {
    await auth.signOut();
  };

  const getTemplateById = (templateId: string) => {
    const found = templates.find(t => t.id === templateId) || bookmarkedTemplates.find(t => t.id === templateId);
    return found;
  }

  const getTemplatesByCreatorId = async (creatorId: string): Promise<Template[]> => {
    const q = db.collection('templates').where('uploader_id', '==', creatorId).where('is_active', '==', true);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
    } as Template));
  };


  const getIsBookmarked = (templateId: string) => {
    if (!currentUser) return false;
    return bookmarks.some(b => b.template_id === templateId);
  };

  const toggleBookmark = async (templateId: string) => {
    if (!currentUser) return;
    const existingBookmark = bookmarks.find(b => b.template_id === templateId);

    if (existingBookmark) {
      await db.collection("bookmarks").doc(existingBookmark.id).delete();
    } else {
      await db.collection("bookmarks").add({
        user_id: currentUser.id,
        template_id: templateId,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  };

  const getIsLiked = (templateId: string) => {
    if (!currentUser) return false;
    return likes.some(l => l.template_id === templateId);
  };

  const toggleLike = async (templateId: string) => {
    if (!currentUser) return;
    const existingLike = likes.find(l => l.template_id === templateId);
    const templateRef = db.collection("templates").doc(templateId);
    const increment = firebase.firestore.FieldValue.increment;

    if (existingLike) {
      await db.collection("likes").doc(existingLike.id).delete();
      await templateRef.update({ likeCount: increment(-1) });
    } else {
      await db.collection("likes").add({
        user_id: currentUser.id,
        template_id: templateId,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await templateRef.update({ likeCount: increment(1) });
    }
  };
  
  const getSavedDesignById = (designId: string) => savedDesigns.find(d => d.id === designId);

  const saveDesign = async (designData: Omit<SavedDesign, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => {
    if (!currentUser) return;
    
    const layersJsonString = JSON.stringify(designData.layers_json);

    if (designData.id) {
        const docRef = db.collection("savedDesigns").doc(designData.id);
        await docRef.set({
            ...designData,
            layers_json: layersJsonString,
            user_id: currentUser.id,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } else {
        const { id, ...restOfData } = designData; 
        await db.collection("savedDesigns").add({
            ...restOfData,
            layers_json: layersJsonString,
            user_id: currentUser.id,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        });
    }
  };
  
  const addDownload = async (downloadData: Omit<Download, 'id'|'user_id'|'timestamp'>) => {
      if(!currentUser) return;
      const templateRef = db.collection("templates").doc(downloadData.template_id);
      const downloadRef = db.collection("downloads").doc();
      const batch = db.batch();

      batch.set(downloadRef, {
          ...downloadData,
          user_id: currentUser.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      batch.update(templateRef, {
          downloadCount: firebase.firestore.FieldValue.increment(1)
      });
      
      await batch.commit();
  };
  
  const submitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
    if(!currentUser || currentUser.role !== Role.USER) return;
    
    const templateDocRef = db.collection('templates').doc();
    const templateId = templateDocRef.id;

    const [png_url, bg_preview_url, composite_preview_url] = await Promise.all([
        uploadFile(files.pngFile, `templates/${templateId}/overlay.png`),
        uploadFile(files.bgFile, `templates/${templateId}/bg_preview.jpg`),
        uploadFile(files.compositeFile, `templates/${templateId}/composite_preview.jpg`),
    ]);

    const newSubmission = {
        ...submissionData,
        png_url,
        bg_preview_url,
        composite_preview_url,
        uploader_id: currentUser.id,
        uploader_username: currentUser.name,
        status: SubmissionStatus.PENDING,
        is_active: false,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        likeCount: 0,
        downloadCount: 0,
    };
    await templateDocRef.set(newSubmission);
  };

  const updateUsername = async (newUsername: string) => {
      if (!currentUser) throw new Error('No user logged in.');

      const now = new Date();
      if (currentUser.lastUsernameChangeAt) {
          const lastChange = new Date(currentUser.lastUsernameChangeAt);
          const diffDays = (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 15) {
              throw new Error(`You can change your username again in ${Math.ceil(15 - diffDays)} days.`);
          }
      }
      
      const userDocRef = db.collection("users").doc(currentUser.id);
      await userDocRef.update({ name: newUsername, lastUsernameChangeAt: firebase.firestore.FieldValue.serverTimestamp() });
  }

  const submitSuggestion = async (text: string) => {
      if (!currentUser || !text.trim()) return;
      await db.collection("suggestions").add({
          user_id: currentUser.id,
          user_name: currentUser.name,
          text: text.trim(),
          created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  const subscribeToNotifications = async () => {
    if (!messaging || !currentUser) {
        throw new Error('Notifications are not supported on this device.');
    }
    try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
            const vapidKey = import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY;
            if (!vapidKey) {
                throw new Error("VAPID key for notifications is not configured.");
            }
            const token = await messaging.getToken({ vapidKey });
            if (token) {
                console.log('FCM Token:', token);
                const userDocRef = db.collection('users').doc(currentUser.id);
                await userDocRef.update({
                    fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
                });
                alert('You are now subscribed to notifications!');
            } else {
                console.log('No registration token available. Request permission to generate one.');
                throw new Error('Could not get notification token.');
            }
        } else {
            console.log('Unable to get permission to notify.');
            throw new Error('Notification permission was not granted.');
        }
    } catch (error) {
        console.error('An error occurred while subscribing to notifications:', error);
        throw error;
    }
  };
  
  const generateTags = async (title: string, imageFile: File): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY environment variable is not set for AI features.");
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        }
        reader.onerror = error => reject(error);
    });

    const imageBase64 = await toBase64(imageFile);

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: imageFile.type,
        },
    };

    const textPart = {
        text: `Analyze the title and the image for this template. The image is a transparent PNG overlay that will be placed on top of user photos. The title is "${title}". Suggest 5-7 relevant, comma-separated, lowercase, single-word tags for searching. For example: "birthday, celebration, party, frame, fun". Only return the comma-separated tags, nothing else.`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  };

  // Admin functions
  const adminSubmitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
      if(!currentUser || currentUser.role !== Role.ADMIN) return;
      const templateDocRef = db.collection('templates').doc();
      const templateId = templateDocRef.id;

      const [png_url, bg_preview_url, composite_preview_url] = await Promise.all([
        uploadFile(files.pngFile, `templates/${templateId}/overlay.png`),
        uploadFile(files.bgFile, `templates/${templateId}/bg_preview.jpg`),
        uploadFile(files.compositeFile, `templates/${templateId}/composite_preview.jpg`),
    ]);


      const newTemplate = {
          ...submissionData,
          png_url,
          bg_preview_url,
          composite_preview_url,
          uploader_id: currentUser.id,
          uploader_username: currentUser.name,
          status: SubmissionStatus.APPROVED,
          is_active: true,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
          likeCount: 0,
          downloadCount: 0,
      };
      await templateDocRef.set(newTemplate);
  };

  const updateTemplate = async (templateId: string, templateData: Partial<Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'created_at' | 'status'>>) => {
      if(!currentUser || currentUser.role !== Role.ADMIN) return;
      await db.collection("templates").doc(templateId).update(templateData);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    const template = templates.find(t => t.id === templateId);
    if(template){
        try { await storage.ref(`templates/${templateId}/overlay.png`).delete(); } catch(e) { console.error(e); }
        try { await storage.ref(`templates/${templateId}/bg_preview.jpg`).delete(); } catch(e) { console.error(e); }
        try { await storage.ref(`templates/${templateId}/composite_preview.jpg`).delete(); } catch(e) { console.error(e); }
    }
    await db.collection("templates").doc(templateId).delete();
  };

  const approveTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    await db.collection("templates").doc(templateId).update({ status: SubmissionStatus.APPROVED, is_active: true });
  };

  const rejectTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    await db.collection("templates").doc(templateId).update({ status: SubmissionStatus.REJECTED, is_active: false });
  };
  
  const addCategory = async (name: CategoryName) => {
    if (!currentUser || currentUser.role !== Role.ADMIN || !name.trim()) return;
    await db.collection("categories").add({ name: name.trim() });
  };

  const deleteCategory = async (categoryId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;
    
    const q = db.collection("templates").where("category", "==", categoryToDelete.name);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
        throw new Error('This category is currently in use by one or more templates and cannot be deleted.');
    }

    await db.collection("categories").doc(categoryId).delete();
  };
  
  const sendNotification = async (title: string, body: string) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) return;
      await db.collection("notifications").add({
          title,
          body,
          sent_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
  };

  const updateAppSettings = async (settings: Partial<AppSettings>) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) {
          throw new Error("Permission denied.");
      }
      await db.collection("settings").doc("app").set(settings, { merge: true });
  };
  
  const uploadAdminFile = async (file: File | Blob, path: string): Promise<string> => {
      if (!currentUser || currentUser.role !== Role.ADMIN) {
          throw new Error("Permission denied.");
      }
      return uploadFile(file, path);
  };

  const value: DataContextType = {
    users, templates,
    bookmarks, bookmarkedTemplates, likes, savedDesigns, downloads, categories, suggestions, notifications, 
    appSettings,
    currentUser, loading, templatesLoading,
    notificationPermission,
    login, signup, logout,
    getTemplatesByCreatorId,
    getTemplateById, getIsBookmarked, toggleBookmark, getIsLiked, toggleLike, getSavedDesignById, saveDesign, addDownload, submitTemplate, updateUsername, submitSuggestion, subscribeToNotifications,
    generateTags,
    adminSubmitTemplate, updateTemplate, deleteTemplate, approveTemplate, rejectTemplate, addCategory, deleteCategory,
    sendNotification,
    updateAppSettings,
    uploadAdminFile,
    installPromptEvent, triggerInstallPrompt,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};