import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, SubmissionStatus } from '../types';
import type { User, Template, Bookmark, SavedDesign, Download, Category, CategoryName, Suggestion, AppSettings, UserFromFirestore, Notification, Like, Language, SavedDesignData } from '../types';
// FIX: Import firebase default for compat types, and named exports for service instances.
import firebase, { auth, db, storage, messaging } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATES_PER_PAGE = 12;

interface DataContextType {
  // State
  users: User[];
  templates: Template[]; // Paginated for users
  adminTemplates: Template[]; // All templates for admin
  bookmarks: Bookmark[];
  bookmarkedTemplates: Template[]; // Specifically fetched bookmarked templates
  likes: Like[];
  savedDesigns: SavedDesign[];
  downloads: Download[];
  categories: Category[];
  languages: Language[];
  suggestions: Suggestion[];
  notifications: Notification[];
  appSettings: AppSettings;
  currentUser: User | null;
  loading: boolean;
  templatesLoading: boolean;
  hasMoreTemplates: boolean;
  notificationPermission: NotificationPermission;

  // Auth
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  
  // Templates
  fetchMoreTemplates: () => void;
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
  submitTemplate: (submissionData: Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'status' | 'is_active' | 'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'uniqueCode' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  submitSuggestion: (text: string) => Promise<void>;
  subscribeToNotifications: () => Promise<void>;

  // Admin Actions
  adminSubmitTemplate: (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'uniqueCode' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  updateTemplate: (templateId: string, templateData: Partial<Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'created_at' | 'status'>>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  approveTemplate: (templateId: string) => Promise<void>;
  rejectTemplate: (templateId: string) => Promise<void>;
  addCategory: (name: CategoryName) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addLanguage: (name: string) => Promise<void>;
  deleteLanguage: (languageId: string) => Promise<void>;
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
    featuredTemplates: [],
    watermarkEnabled: true,
    watermarkText: 'www.timepasskatta.app'
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [adminTemplates, setAdminTemplates] = useState<Template[]>([]); // For admin use
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedTemplates, setBookmarkedTemplates] = useState<Template[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // State for pagination
  const [lastTemplateVisible, setLastTemplateVisible] = useState<firebase.firestore.QueryDocumentSnapshot | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [hasMoreTemplates, setHasMoreTemplates] = useState(true);

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
      if (timestamp instanceof firebase.firestore.Timestamp) {
          return timestamp.toDate().toISOString();
      }
      if (timestamp === null || timestamp === undefined) {
        return new Date().toISOString();
      }
      return timestamp;
  }
  const toISOStringSafeOrNull = (timestamp: any): string | null => {
      if (timestamp instanceof firebase.firestore.Timestamp) {
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
            // CLEANUP: Clear user-specific data on logout to prevent flash of old content
            setBookmarks([]);
            setSavedDesigns([]);
            setDownloads([]);
            setLikes([]);
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

    const unsubLanguages = db.collection("languages").onSnapshot((snapshot) => {
        setLanguages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Language)));
    }, (error) => console.error("Error fetching languages:", error));
    
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

    return () => {
        unsubUsers();
        unsubCategories();
        unsubLanguages();
        unsubSuggestions();
        unsubAppSettings();
        unsubNotifications();
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
            // Ensure layers_json is parsed correctly
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

  // *** BUG FIX: Dedicated effect to fetch full bookmarked template data ***
  useEffect(() => {
    if (!currentUser || bookmarks.length === 0) {
        setBookmarkedTemplates([]);
        return;
    }

    const bookmarkedIds = bookmarks.map(b => b.template_id);
    // Firestore 'in' queries are limited to 10 items. We must batch them.
    const fetchPromises: Promise<firebase.firestore.QuerySnapshot>[] = [];
    for (let i = 0; i < bookmarkedIds.length; i += 10) {
        const chunk = bookmarkedIds.slice(i, i + 10);
        if (chunk.length > 0) {
            fetchPromises.push(db.collection('templates').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get());
        }
    }
    
    Promise.all(fetchPromises).then(snapshots => {
        const fetchedTemplates: Template[] = [];
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                fetchedTemplates.push({
                    id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
                } as Template);
            });
        });
        setBookmarkedTemplates(fetchedTemplates);
    }).catch(error => {
        console.error("Error fetching bookmarked templates:", error);
    });

  }, [bookmarks, currentUser]); // Rerun when bookmarks list changes


  // *** PERFORMANCE: Real-time paginated listener for users ***
  useEffect(() => {
    if (currentUser?.role === Role.ADMIN) {
        setTemplates([]);
        setTemplatesLoading(false);
        setHasMoreTemplates(false);
        return;
    }
    setTemplatesLoading(true);
    const q = db.collection("templates").orderBy("created_at", "desc").limit(TEMPLATES_PER_PAGE);

    const unsub = q.onSnapshot((snapshot) => {
        if (snapshot.empty) {
            setTemplates([]);
            setHasMoreTemplates(false);
        } else {
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastTemplateVisible(lastVisible);
            setHasMoreTemplates(snapshot.docs.length === TEMPLATES_PER_PAGE);
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
            })) as Template[];
            setTemplates(fetchedTemplates);
        }
        setTemplatesLoading(false);
    }, (error) => {
        console.error("Error fetching initial templates:", error);
        setTemplatesLoading(false);
    });
    
    return () => unsub();
  }, [currentUser]);

  // *** PERFORMANCE: Listener for ALL templates for ADMINS ONLY ***
  useEffect(() => {
    if (currentUser?.role !== Role.ADMIN) {
        setAdminTemplates([]);
        return;
    }
    const unsub = db.collection("templates").orderBy("created_at", "desc").onSnapshot((snapshot) => {
        const allTemplates = snapshot.docs.map(doc => ({
            id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
        } as Template));
        setAdminTemplates(allTemplates);
    }, (error) => console.error("Error fetching all templates for admin:", error));
    return () => unsub();
  }, [currentUser]);


  const fetchMoreTemplates = async () => {
      if (!lastTemplateVisible || !hasMoreTemplates || templatesLoading || currentUser?.role === Role.ADMIN) return;
      
      setTemplatesLoading(true);

      const q = db.collection("templates")
          .orderBy("created_at", "desc")
          .startAfter(lastTemplateVisible)
          .limit(TEMPLATES_PER_PAGE);

      const snapshot = await q.get();

      if (snapshot.empty) {
          setHasMoreTemplates(false);
          setTemplatesLoading(false);
          return;
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastTemplateVisible(lastVisible);
      setHasMoreTemplates(snapshot.docs.length === TEMPLATES_PER_PAGE);
      
      const newTemplates = snapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(), created_at: toISOStringSafe(doc.data().created_at)
      })) as Template[];

      setTemplates(prev => [...prev, ...newTemplates]);
      setTemplatesLoading(false);
  };

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
    // No need to set current user here, onAuthStateChanged will handle it
  };
  
  const login = async (email: string, pass: string): Promise<void> => {
    await auth.signInWithEmailAndPassword(email, pass);
     // No need to set current user here, onAuthStateChanged will handle it
  }

  const logout = async () => {
    await auth.signOut();
    // State clearing is handled by the onAuthStateChanged listener
  };

  const getTemplateById = (templateId: string) => {
    // Admin will have all templates, user will have paginated ones
    const sourceArray = currentUser?.role === Role.ADMIN ? adminTemplates : templates;
    // Also check bookmarked templates for users, as it might not be in the paginated list
    const found = sourceArray.find(t => t.id === templateId) || bookmarkedTemplates.find(t => t.id === templateId);
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
    
    // Ensure muted is explicitly handled
    const bgMedia = designData.layers_json.bgMedia;
    if (bgMedia.type === 'video' && bgMedia.muted === undefined) {
        bgMedia.muted = true; // Default to muted if not specified
    }

    // Convert complex object to JSON string for Firestore
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
  
  const generateUniqueCode = async (): Promise<string> => {
    const counterRef = db.collection('counters').doc('templates');
    let newCode = 'TK0001';

    await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const currentCount = counterDoc.exists ? (counterDoc.data()?.count || 0) : 0;
        const newCount = currentCount + 1;
        newCode = `TK${String(newCount).padStart(4, '0')}`;
        transaction.set(counterRef, { count: newCount }, { merge: true });
    });

    return newCode;
  };
  
  const submitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'uniqueCode' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
    if(!currentUser || currentUser.role !== Role.USER) return;
    
    const templateDocRef = db.collection('templates').doc();
    const templateId = templateDocRef.id;

    const [png_url, bg_preview_url, composite_preview_url, uniqueCode] = await Promise.all([
        uploadFile(files.pngFile, `templates/${templateId}/overlay.png`),
        uploadFile(files.bgFile, `templates/${templateId}/bg_preview.jpg`),
        uploadFile(files.compositeFile, `templates/${templateId}/composite_preview.jpg`),
        generateUniqueCode()
    ]);

    const newSubmission = {
        ...submissionData,
        uniqueCode,
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
  const adminSubmitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url' | 'uniqueCode' | 'likeCount' | 'downloadCount'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
      if(!currentUser || currentUser.role !== Role.ADMIN) return;
      const templateDocRef = db.collection('templates').doc();
      const templateId = templateDocRef.id;

      const [png_url, bg_preview_url, composite_preview_url, uniqueCode] = await Promise.all([
        uploadFile(files.pngFile, `templates/${templateId}/overlay.png`),
        uploadFile(files.bgFile, `templates/${templateId}/bg_preview.jpg`),
        uploadFile(files.compositeFile, `templates/${templateId}/composite_preview.jpg`),
        generateUniqueCode()
    ]);


      const newTemplate = {
          ...submissionData,
          uniqueCode,
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

      const updateData: any = { ...templateData };
      
      await db.collection("templates").doc(templateId).update(updateData);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    const template = adminTemplates.find(t => t.id === templateId);
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

    const addLanguage = async (name: string) => {
        if (!currentUser || currentUser.role !== Role.ADMIN || !name.trim()) return;
        await db.collection("languages").add({ name: name.trim() });
    };

    const deleteLanguage = async (languageId: string) => {
        if (!currentUser || currentUser.role !== Role.ADMIN) return;

        const languageToDelete = languages.find(l => l.id === languageId);
        if (!languageToDelete) return;
        
        const q = db.collection("templates").where("language", "==", languageToDelete.name);
        const querySnapshot = await q.get();
        if (!querySnapshot.empty) {
            throw new Error('This language is in use by one or more templates and cannot be deleted.');
        }
        await db.collection("languages").doc(languageId).delete();
    };
  
  const updateAppSettings = async (settings: Partial<AppSettings>) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) return;
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
    users, templates, adminTemplates, bookmarks, bookmarkedTemplates, likes, savedDesigns, downloads, categories, languages, suggestions, notifications, appSettings, currentUser, loading, templatesLoading, hasMoreTemplates, notificationPermission,
    login, signup, logout,
    fetchMoreTemplates, getTemplatesByCreatorId,
    getTemplateById, getIsBookmarked, toggleBookmark, getIsLiked, toggleLike, getSavedDesignById, saveDesign, addDownload, submitTemplate, updateUsername, submitSuggestion, subscribeToNotifications,
    adminSubmitTemplate, updateTemplate, deleteTemplate, approveTemplate, rejectTemplate, addCategory, deleteCategory, addLanguage, deleteLanguage, updateAppSettings, uploadAdminFile, sendNotification,
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