import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, SubmissionStatus } from '../types';
import type { User, Template, Bookmark, SavedDesign, Download, Category, CategoryName, Suggestion, AppSettings, UserFromFirestore, Notification, Like } from '../types';
// FIX: Import firebase default for compat types, and named exports for service instances.
import firebase, { auth, db, storage, messaging } from '../firebase';
import { v4 as uuidv4 } from 'uuid';


interface DataContextType {
  // State
  users: User[];
  templates: Template[];
  bookmarks: Bookmark[];
  likes: Like[];
  savedDesigns: SavedDesign[];
  downloads: Download[];
  categories: Category[];
  suggestions: Suggestion[];
  notifications: Notification[];
  appSettings: AppSettings;
  currentUser: User | null;
  loading: boolean;
  notificationPermission: NotificationPermission;

  // Auth
  login: (email: string, pass: string) => Promise<User | void>;
  signup: (name: string, email: string, pass: string) => Promise<User | void>;
  startSession: (user: User) => void;
  logout: () => void;

  // User Actions
  getTemplateById: (templateId: string) => Template | undefined;
  getIsBookmarked: (templateId: string) => boolean;
  toggleBookmark: (templateId: string) => Promise<void>;
  getIsLiked: (templateId: string) => boolean;
  toggleLike: (templateId: string) => Promise<void>;
  getSavedDesignById: (designId: string) => SavedDesign | undefined;
  saveDesign: (designData: Omit<SavedDesign, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => Promise<void>;
  addDownload: (downloadData: Omit<Download, 'id' | 'user_id' | 'timestamp'>) => Promise<void>;
  submitTemplate: (submissionData: Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'status' | 'is_active' | 'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  getDownloadsForTemplate: (templateId: string) => number;
  updateUsername: (newUsername: string) => Promise<void>;
  submitSuggestion: (text: string) => Promise<void>;
  subscribeToNotifications: () => Promise<void>;

  // Admin Actions
  adminSubmitTemplate: (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  updateTemplate: (templateId: string, templateData: Partial<Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'created_at' | 'status'>>, newFiles?: {pngFile?: File, bgFile?: File, compositeFile?: Blob}) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  approveTemplate: (templateId: string) => Promise<void>;
  rejectTemplate: (templateId: string) => Promise<void>;
  addCategory: (name: CategoryName) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  uploadAdminFile: (file: File | Blob, path: string) => Promise<string>;
  sendNotification: (title: string, body: string) => Promise<void>;

  // PWA Install
  installPromptEvent: any | null;
  triggerInstallPrompt: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    // FIX: Use compat storage API
    const storageRef = storage.ref(path);
    await storageRef.put(file);
    return await storageRef.getDownloadURL();
};

const defaultAppSettings: AppSettings = {
    aboutUs: '',
    terms: '',
    contactEmail: '',
    adsEnabled: false,
    adSensePublisherId: '',
    adSenseSlotId: '',
    faviconUrl: '',
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
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

  // Safely convert Firestore Timestamp to ISO string
  const toISOStringSafe = (timestamp: any): string => {
      // FIX: Use compat Timestamp type for instanceof check
      if (timestamp instanceof firebase.firestore.Timestamp) {
          return timestamp.toDate().toISOString();
      }
      // Fallback for serverTimestamp pending writes
      if (timestamp === null || timestamp === undefined) {
        return new Date().toISOString();
      }
      return timestamp;
  }
  const toISOStringSafeOrNull = (timestamp: any): string | null => {
      // FIX: Use compat Timestamp type for instanceof check
      if (timestamp instanceof firebase.firestore.Timestamp) {
          return timestamp.toDate().toISOString();
      }
      return null;
  }

  useEffect(() => {
    // FIX: Use compat library syntax for onAuthStateChanged
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            // FIX: Use compat firestore API
            const userDocRef = db.collection("users").doc(user.uid);
            const userDoc = await userDocRef.get();
            if(userDoc.exists && auth.currentUser && auth.currentUser.uid === user.uid){
                const userDataFromDb = userDoc.data() as UserFromFirestore;
                // FIX: Explicitly create a plain object to prevent circular structure errors
                const plainUserObject: User = { 
                    id: user.uid, 
                    name: userDataFromDb.name,
                    email: userDataFromDb.email,
                    emailVerified: userDataFromDb.emailVerified,
                    photo_url: userDataFromDb.photo_url,
                    role: userDataFromDb.role,
                    creator_id: userDataFromDb.creator_id,
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
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    // FIX: Use compat firestore API
    const unsubUsers = db.collection("users").onSnapshot((snapshot) => {
        setUsers(snapshot.docs.map(doc => {
            const data = doc.data();
            // FIX: Explicitly create a plain object to prevent circular structure errors
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

    const unsubTemplates = db.collection("templates").onSnapshot((snapshot) => {
        const fetchedTemplates = snapshot.docs.map(doc => {
            const data = doc.data();
            // FIX: Explicitly create a plain object
            return {
                id: doc.id,
                title: data.title,
                category: data.category,
                language: data.language,
                tags: data.tags,
                png_url: data.png_url,
                bg_preview_url: data.bg_preview_url,
                composite_preview_url: data.composite_preview_url,
                status: data.status,
                is_active: data.is_active,
                ratio_default: data.ratio_default,
                ratios_supported: data.ratios_supported,
                uploader_id: data.uploader_id,
                uploader_username: data.uploader_username,
                created_at: toISOStringSafe(data.created_at),
                downloadCount: 0, // Initialize download count
                likeCount: 0 // Initialize like count
            } as Template;
        });

        // Fetch all downloads and likes to calculate counts
        const downloadsPromise = db.collection("downloads").get();
        const likesPromise = db.collection("likes").get();

        Promise.all([downloadsPromise, likesPromise]).then(([downloadSnapshot, likeSnapshot]) => {
            const downloadCounts = new Map<string, number>();
            downloadSnapshot.docs.forEach(doc => {
                const templateId = doc.data().template_id;
                downloadCounts.set(templateId, (downloadCounts.get(templateId) || 0) + 1);
            });

            const likeCounts = new Map<string, number>();
            likeSnapshot.docs.forEach(doc => {
                const templateId = doc.data().template_id;
                likeCounts.set(templateId, (likeCounts.get(templateId) || 0) + 1);
            });

            // Attach counts to templates
            const templatesWithCounts = fetchedTemplates.map(template => ({
                ...template,
                downloadCount: downloadCounts.get(template.id) || 0,
                likeCount: likeCounts.get(template.id) || 0
            }));
            
            setTemplates(templatesWithCounts);
        });

    }, (error) => console.error("Error fetching templates:", error));

    const unsubCategories = db.collection("categories").onSnapshot((snapshot) => {
        setCategories(snapshot.docs.map(doc => {
            const data = doc.data();
            // FIX: Explicitly create a plain object
            return { 
                id: doc.id,
                name: data.name
            } as Category;
        }));
    }, (error) => console.error("Error fetching categories:", error));

    const unsubSuggestions = db.collection("suggestions").onSnapshot((snapshot) => {
        setSuggestions(snapshot.docs.map(doc => {
            const data = doc.data();
            // FIX: Explicitly create a plain object
            return {
                id: doc.id,
                user_id: data.user_id,
                user_name: data.user_name,
                text: data.text,
                created_at: toISOStringSafe(data.created_at)
            } as Suggestion;
        }));
    }, (error) => console.error("Error fetching suggestions:", error));

     const unsubNotifications = db.collection("notifications").orderBy("sent_at", "desc").onSnapshot((snapshot) => {
        setNotifications(snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                body: data.body,
                sent_at: toISOStringSafe(data.sent_at),
            } as Notification;
        }));
    }, (error) => console.error("Error fetching notifications:", error));

    const unsubAppSettings = db.collection("settings").doc("app").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data() as Partial<AppSettings>;
            setAppSettings({
                aboutUs: data.aboutUs || '',
                terms: data.terms || '',
                contactEmail: data.contactEmail || '',
                adsEnabled: data.adsEnabled || false,
                adSensePublisherId: data.adSensePublisherId || '',
                adSenseSlotId: data.adSenseSlotId || '',
                faviconUrl: data.faviconUrl || '',
            });
        } else {
             setAppSettings(defaultAppSettings);
        }
    }, (error) => console.error("Error fetching app settings:", error));

    return () => {
        unsubUsers();
        unsubTemplates();
        unsubCategories();
        unsubSuggestions();
        unsubAppSettings();
        unsubNotifications();
    };
  }, []);
  
    useEffect(() => {
        if (!currentUser) {
            setBookmarks([]);
            setSavedDesigns([]);
            setDownloads([]);
            setLikes([]);
            return;
        }
        
        // FIX: Use compat firestore API
        const qBookmarks = db.collection("bookmarks").where("user_id", "==", currentUser.id);
        const unsubBookmarks = qBookmarks.onSnapshot((snapshot) => {
            setBookmarks(snapshot.docs.map(doc => {
                const data = doc.data();
                // FIX: Explicitly create a plain object
                return {
                    id: doc.id,
                    user_id: data.user_id,
                    template_id: data.template_id,
                    created_at: toISOStringSafe(data.created_at)
                } as Bookmark;
            }));
        });

        const qLikes = db.collection("likes").where("user_id", "==", currentUser.id);
        const unsubLikes = qLikes.onSnapshot((snapshot) => {
            setLikes(snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    user_id: data.user_id,
                    template_id: data.template_id,
                    created_at: toISOStringSafe(data.created_at)
                } as Like;
            }));
        });

        const qDesigns = db.collection("savedDesigns").where("user_id", "==", currentUser.id);
        const unsubDesigns = qDesigns.onSnapshot((snapshot) => {
            setSavedDesigns(snapshot.docs.map(doc => {
                const data = doc.data();
                // FIX: Explicitly create a plain object
                return {
                    id: doc.id,
                    user_id: data.user_id,
                    template_id: data.template_id,
                    ratio: data.ratio,
                    layers_json: data.layers_json,
                    updated_at: toISOStringSafe(data.updated_at)
                } as SavedDesign;
            }));
        });
        
        const qDownloads = db.collection("downloads").where("user_id", "==", currentUser.id);
        const unsubDownloads = qDownloads.onSnapshot((snapshot) => {
            setDownloads(snapshot.docs.map(doc => {
                const data = doc.data();
                // FIX: Explicitly create a plain object
                return {
                    id: doc.id,
                    user_id: data.user_id,
                    template_id: data.template_id,
                    design_id: data.design_id,
                    file_url: data.file_url,
                    local_only: data.local_only,
                    timestamp: toISOStringSafe(data.timestamp),
                    thumbnail: data.thumbnail
                } as Download;
            }));
        });

        return () => {
            unsubBookmarks();
            unsubDesigns();
            unsubDownloads();
            unsubLikes();
        };
    }, [currentUser]);

  const signup = async (name: string, email: string, pass: string): Promise<User | void> => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    const user = userCredential.user;
    if (!user) {
        throw new Error("Could not create user account.");
    }

    const creator_id = `TK${Date.now().toString().slice(-6)}`;
    const newUser = {
      name,
      email,
      emailVerified: true, // No verification needed
      photo_url: `https://i.pravatar.cc/150?u=${user.uid}`,
      role: Role.USER,
      creator_id,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      lastUsernameChangeAt: null,
      fcmTokens: [],
    };
    await db.collection("users").doc(user.uid).set(newUser);
    const appUser: User = {
      id: user.uid,
      name: newUser.name,
      email: newUser.email,
      emailVerified: newUser.emailVerified,
      photo_url: newUser.photo_url,
      role: newUser.role,
      creator_id: newUser.creator_id,
      created_at: new Date().toISOString(),
      lastUsernameChangeAt: null,
      fcmTokens: [],
    };
    startSession(appUser);
    return appUser;
  };
  
  const login = async (email: string, pass: string): Promise<User | void> => {
    const userCredential = await auth.signInWithEmailAndPassword(email, pass);
    const user = userCredential.user;
    if (!user) {
      throw new Error("Login failed.");
    }
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
        throw new Error("User data not found in database.");
    }

    const userDataFromDb = userDoc.data() as UserFromFirestore;
    const appUser: User = {
      id: user.uid,
      name: userDataFromDb.name,
      email: userDataFromDb.email,
      emailVerified: userDataFromDb.emailVerified,
      photo_url: userDataFromDb.photo_url,
      role: userDataFromDb.role,
      creator_id: userDataFromDb.creator_id,
      created_at: toISOStringSafe(userDataFromDb.created_at),
      lastUsernameChangeAt: toISOStringSafeOrNull(userDataFromDb.lastUsernameChangeAt),
      fcmTokens: userDataFromDb.fcmTokens || [],
    };
    startSession(appUser);
    return appUser;
  }

  const startSession = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('timepass-katta-user', JSON.stringify(user));
  };

  const logout = async () => {
    // FIX: Use compat library syntax for signOut
    await auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('timepass-katta-user');
  };

  const getTemplateById = (templateId: string) => templates.find(t => t.id === templateId);

  const getIsBookmarked = (templateId: string) => {
    if (!currentUser) return false;
    return bookmarks.some(b => b.template_id === templateId);
  };

  const toggleBookmark = async (templateId: string) => {
    if (!currentUser) return;
    const existingBookmark = bookmarks.find(b => b.template_id === templateId);

    if (existingBookmark) {
      // FIX: Use compat firestore API
      await db.collection("bookmarks").doc(existingBookmark.id).delete();
    } else {
      // FIX: Use compat firestore API
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

    if (existingLike) {
      await db.collection("likes").doc(existingLike.id).delete();
    } else {
      await db.collection("likes").add({
        user_id: currentUser.id,
        template_id: templateId,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  };
  
  const getSavedDesignById = (designId: string) => savedDesigns.find(d => d.id === designId);

  const saveDesign = async (designData: Omit<SavedDesign, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => {
    if (!currentUser) return;
    
    // CRITICAL BUG FIX: Separate logic for create (addDoc) and update (setDoc)
    if (designData.id) {
        // This is an UPDATE
        // FIX: Use compat firestore API
        const docRef = db.collection("savedDesigns").doc(designData.id);
        const dataToSave = {
            ...designData,
            user_id: currentUser.id,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(dataToSave, { merge: true });
    } else {
        // This is a CREATE - remove the undefined 'id' field
        const { id, ...restOfData } = designData; 
        const dataToSave = {
            ...restOfData,
            user_id: currentUser.id,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        };
        // FIX: Use compat firestore API
        await db.collection("savedDesigns").add(dataToSave);
    }
  };
  
  const addDownload = async (downloadData: Omit<Download, 'id'|'user_id'|'timestamp'>) => {
      if(!currentUser) return;
      // FIX: Use compat firestore API
      await db.collection("downloads").add({
          ...downloadData,
          user_id: currentUser.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
  };
  
  const submitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
    if(!currentUser || currentUser.role !== Role.USER) return;
    
    // FIX: Use compat firestore API
    const templateDocRef = db.collection('templates').doc();
    const templateId = templateDocRef.id;

    const png_url = await uploadFile(files.pngFile, `templates/${templateId}/overlay.png`);
    const bg_preview_url = await uploadFile(files.bgFile, `templates/${templateId}/bg_preview.jpg`);
    const composite_preview_url = await uploadFile(files.compositeFile, `templates/${templateId}/composite_preview.jpg`);

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
    };
    await templateDocRef.set(newSubmission);
  };

  const getDownloadsForTemplate = (templateId: string) => {
    return downloads.filter(d => d.template_id === templateId).length;
  }

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
      
      // FIX: Use compat firestore API
      const userDocRef = db.collection("users").doc(currentUser.id);
      await userDocRef.update({ name: newUsername, lastUsernameChangeAt: firebase.firestore.FieldValue.serverTimestamp() });
  }

  const submitSuggestion = async (text: string) => {
      if (!currentUser || !text.trim()) return;
      // FIX: Use compat firestore API
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
            const token = await messaging.getToken({ vapidKey: 'BJEZnp2j8mN-73y-aO3sC0s_Y-aI8C4A7gZ_p_Q5F9X8fG4oY3wZJ9tZzCjJ3X1e9wZ6hH8xQ3C5yI' });
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
  
  // Admin functions
  const adminSubmitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
      if(!currentUser || currentUser.role !== Role.ADMIN) return;
      // FIX: Use compat firestore API
      const templateDocRef = db.collection('templates').doc();
      const templateId = templateDocRef.id;

      const png_url = await uploadFile(files.pngFile, `templates/${templateId}/overlay.png`);
      const bg_preview_url = await uploadFile(files.bgFile, `templates/${templateId}/bg_preview.jpg`);
      const composite_preview_url = await uploadFile(files.compositeFile, `templates/${templateId}/composite_preview.jpg`);


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
      };
      await templateDocRef.set(newTemplate);
  };

  const updateTemplate = async (templateId: string, templateData: Partial<Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'created_at' | 'status'>>, newFiles?: {pngFile?: File, bgFile?: File, compositeFile?: Blob}) => {
      if(!currentUser || currentUser.role !== Role.ADMIN) return;

      const updateData: any = { ...templateData };
      if(newFiles?.pngFile) {
          updateData.png_url = await uploadFile(newFiles.pngFile, `templates/${templateId}/overlay.png`);
      }
      if(newFiles?.bgFile) {
          updateData.bg_preview_url = await uploadFile(newFiles.bgFile, `templates/${templateId}/bg_preview.jpg`);
      }
      // CRITICAL BUG FIX: Handle composite file update
      if(newFiles?.compositeFile) {
          updateData.composite_preview_url = await uploadFile(newFiles.compositeFile, `templates/${templateId}/composite_preview.jpg`);
      }
      
      // FIX: Use compat firestore API
      await db.collection("templates").doc(templateId).update(updateData);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    const template = templates.find(t => t.id === templateId);
    if(template){
        // FIX: Use compat storage API
        try { await storage.ref(`templates/${templateId}/overlay.png`).delete(); } catch(e) { console.error(e); }
        try { await storage.ref(`templates/${templateId}/bg_preview.jpg`).delete(); } catch(e) { console.error(e); }
        try { await storage.ref(`templates/${templateId}/composite_preview.jpg`).delete(); } catch(e) { console.error(e); }
    }
    // FIX: Use compat firestore API
    await db.collection("templates").doc(templateId).delete();
  };

  const approveTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    // FIX: Use compat firestore API
    await db.collection("templates").doc(templateId).update({ status: SubmissionStatus.APPROVED, is_active: true });
  };

  const rejectTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    // FIX: Use compat firestore API
    await db.collection("templates").doc(templateId).update({ status: SubmissionStatus.REJECTED, is_active: false });
  };
  
  const addCategory = async (name: CategoryName) => {
    if (!currentUser || currentUser.role !== Role.ADMIN || !name.trim()) return;
    // FIX: Use compat firestore API
    await db.collection("categories").add({ name: name.trim() });
  };

  const deleteCategory = async (categoryId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;
    
    // FIX: Use compat firestore API
    const q = db.collection("templates").where("category", "==", categoryToDelete.name);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
        throw new Error('This category is currently in use by one or more templates and cannot be deleted.');
    }

    // FIX: Use compat firestore API
    await db.collection("categories").doc(categoryId).delete();
  };
  
  const updateAppSettings = async (settings: Partial<AppSettings>) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) return;
      // FIX: Use compat firestore API
      await db.collection("settings").doc("app").set(settings, { merge: true });
  }
  
  const uploadAdminFile = async (file: File | Blob, path: string): Promise<string> => {
      if (!currentUser || currentUser.role !== Role.ADMIN) {
          throw new Error("You don't have permission to perform this action.");
      }
      return uploadFile(file, path);
  };
  
  const sendNotification = async (title: string, body: string) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) return;
      await db.collection("notifications").add({
          title,
          body,
          sent_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
  };
  
  const value = {
    users, templates, bookmarks, likes, savedDesigns, downloads, categories, suggestions, notifications, appSettings, currentUser, loading, notificationPermission,
    login, signup, startSession, logout,
    getTemplateById, getIsBookmarked, toggleBookmark, getIsLiked, toggleLike, getSavedDesignById, saveDesign, addDownload, submitTemplate, getDownloadsForTemplate, updateUsername, submitSuggestion, subscribeToNotifications,
    adminSubmitTemplate, updateTemplate, deleteTemplate, approveTemplate, rejectTemplate, addCategory, deleteCategory, updateAppSettings, uploadAdminFile, sendNotification,
    installPromptEvent, triggerInstallPrompt
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