import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Template, Bookmark, SavedDesign, Download, Role, SubmissionStatus, Category, CategoryName, Suggestion, AppSettings, UserFromFirestore } from '../types';
import { auth, db, storage } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    collection, 
    onSnapshot, 
    doc, 
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';


interface DataContextType {
  // State
  users: User[];
  templates: Template[];
  bookmarks: Bookmark[];
  savedDesigns: SavedDesign[];
  downloads: Download[];
  categories: Category[];
  suggestions: Suggestion[];
  appSettings: AppSettings;
  currentUser: User | null;
  loading: boolean;

  // Auth
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  startSession: (user: User) => void;
  logout: () => void;
  
  // User Actions
  getTemplateById: (templateId: string) => Template | undefined;
  getIsBookmarked: (templateId: string) => boolean;
  toggleBookmark: (templateId: string) => Promise<void>;
  getSavedDesignById: (designId: string) => SavedDesign | undefined;
  saveDesign: (designData: Omit<SavedDesign, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => Promise<void>;
  addDownload: (downloadData: Omit<Download, 'id' | 'user_id' | 'timestamp'>) => Promise<void>;
  submitTemplate: (submissionData: Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'status' | 'is_active' | 'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  getDownloadsForTemplate: (templateId: string) => number;
  updateUsername: (newUsername: string) => Promise<void>;
  submitSuggestion: (text: string) => Promise<void>;

  // Admin Actions
  adminSubmitTemplate: (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at' | 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => Promise<void>;
  updateTemplate: (templateId: string, templateData: Partial<Omit<Template, 'id' | 'uploader_id' | 'uploader_username' | 'created_at' | 'status'>>, newFiles?: {pngFile?: File, bgFile?: File, compositeFile?: Blob}) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  approveTemplate: (templateId: string) => Promise<void>;
  rejectTemplate: (templateId: string) => Promise<void>;
  addCategory: (name: CategoryName) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({aboutUs: '', terms: '', contactEmail: ''});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Safely convert Firestore Timestamp to ISO string
  const toISOStringSafe = (timestamp: any): string => {
      if (timestamp instanceof Timestamp) {
          return timestamp.toDate().toISOString();
      }
      // Fallback for serverTimestamp pending writes
      if (timestamp === null || timestamp === undefined) {
        return new Date().toISOString();
      }
      return timestamp;
  }
  const toISOStringSafeOrNull = (timestamp: any): string | null => {
      if (timestamp instanceof Timestamp) {
          return timestamp.toDate().toISOString();
      }
      return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()){
                const userDataFromDb = userDoc.data();
                // FIX: Explicitly create a plain object to prevent circular structure errors
                const plainUserObject: User = { 
                    id: user.uid, 
                    name: userDataFromDb.name,
                    photo_url: userDataFromDb.photo_url,
                    role: userDataFromDb.role,
                    creator_id: userDataFromDb.creator_id,
                    created_at: toISOStringSafe(userDataFromDb.created_at),
                    lastUsernameChangeAt: toISOStringSafeOrNull(userDataFromDb.lastUsernameChangeAt)
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
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setUsers(snapshot.docs.map(doc => {
            const data = doc.data();
            // FIX: Explicitly create a plain object to prevent circular structure errors
            return {
                id: doc.id,
                name: data.name,
                photo_url: data.photo_url,
                role: data.role,
                creator_id: data.creator_id,
                created_at: toISOStringSafe(data.created_at),
                lastUsernameChangeAt: toISOStringSafeOrNull(data.lastUsernameChangeAt)
            } as User;
        }));
    }, (error) => console.error("Error fetching users:", error));

    const unsubTemplates = onSnapshot(collection(db, "templates"), (snapshot) => {
        setTemplates(snapshot.docs.map(doc => {
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
                created_at: toISOStringSafe(data.created_at)
            } as Template;
        }));
    }, (error) => console.error("Error fetching templates:", error));

    const unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
        setCategories(snapshot.docs.map(doc => {
            const data = doc.data();
            // FIX: Explicitly create a plain object
            return { 
                id: doc.id,
                name: data.name
            } as Category;
        }));
    }, (error) => console.error("Error fetching categories:", error));

    const unsubSuggestions = onSnapshot(collection(db, "suggestions"), (snapshot) => {
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

    const unsubAppSettings = onSnapshot(doc(db, "settings", "app"), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            // FIX: Explicitly create a plain object
            setAppSettings({
                aboutUs: data.aboutUs,
                terms: data.terms,
                contactEmail: data.contactEmail
            });
        }
    }, (error) => console.error("Error fetching app settings:", error));

    return () => {
        unsubUsers();
        unsubTemplates();
        unsubCategories();
        unsubSuggestions();
        unsubAppSettings();
    };
  }, []);
  
    useEffect(() => {
        if (!currentUser) {
            setBookmarks([]);
            setSavedDesigns([]);
            setDownloads([]);
            return;
        }

        const qBookmarks = query(collection(db, "bookmarks"), where("user_id", "==", currentUser.id));
        const unsubBookmarks = onSnapshot(qBookmarks, (snapshot) => {
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

        const qDesigns = query(collection(db, "savedDesigns"), where("user_id", "==", currentUser.id));
        const unsubDesigns = onSnapshot(qDesigns, (snapshot) => {
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
        
        const qDownloads = query(collection(db, "downloads"), where("user_id", "==", currentUser.id));
        const unsubDownloads = onSnapshot(qDownloads, (snapshot) => {
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
        };
    }, [currentUser]);

  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = {
        name,
        photo_url: `https://i.pravatar.cc/150?u=${userCredential.user.uid}`,
        role: Role.USER,
        creator_id: `TK${Date.now().toString().slice(-6)}`,
        created_at: serverTimestamp(),
        lastUsernameChangeAt: null,
    };
    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
  };

  const login = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
        throw new Error("User data not found.");
    }
    const userDataFromDb = userDoc.data();
    // FIX: Explicitly create a plain object to prevent circular structure errors
    return { 
        id: userCredential.user.uid, 
        name: userDataFromDb.name,
        photo_url: userDataFromDb.photo_url,
        role: userDataFromDb.role,
        creator_id: userDataFromDb.creator_id,
        created_at: toISOStringSafe(userDataFromDb.created_at),
        lastUsernameChangeAt: toISOStringSafeOrNull(userDataFromDb.lastUsernameChangeAt)
    };
  };

  const startSession = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('timepass-katta-user', JSON.stringify(user));
  };

  const logout = async () => {
    await signOut(auth);
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
      await deleteDoc(doc(db, "bookmarks", existingBookmark.id));
    } else {
      await addDoc(collection(db, "bookmarks"), {
        user_id: currentUser.id,
        template_id: templateId,
        created_at: serverTimestamp(),
      });
    }
  };
  
  const getSavedDesignById = (designId: string) => savedDesigns.find(d => d.id === designId);

  const saveDesign = async (designData: Omit<SavedDesign, 'id' | 'user_id' | 'updated_at'> & { id?: string }) => {
    if (!currentUser) return;
    
    // CRITICAL BUG FIX: Separate logic for create (addDoc) and update (setDoc)
    if (designData.id) {
        // This is an UPDATE
        const docRef = doc(db, "savedDesigns", designData.id);
        const dataToSave = {
            ...designData,
            user_id: currentUser.id,
            updated_at: serverTimestamp(),
        };
        await setDoc(docRef, dataToSave, { merge: true });
    } else {
        // This is a CREATE - remove the undefined 'id' field
        const { id, ...restOfData } = designData; 
        const dataToSave = {
            ...restOfData,
            user_id: currentUser.id,
            updated_at: serverTimestamp(),
        };
        await addDoc(collection(db, "savedDesigns"), dataToSave);
    }
  };
  
  const addDownload = async (downloadData: Omit<Download, 'id'|'user_id'|'timestamp'>) => {
      if(!currentUser) return;
      await addDoc(collection(db, "downloads"), {
          ...downloadData,
          user_id: currentUser.id,
          timestamp: serverTimestamp(),
      });
  };
  
  const submitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
    if(!currentUser || currentUser.role !== Role.USER) return;
    
    const templateDocRef = doc(collection(db, 'templates'));
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
        created_at: serverTimestamp(),
    };
    await setDoc(templateDocRef, newSubmission);
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
      
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, { name: newUsername, lastUsernameChangeAt: serverTimestamp() });
  }

  const submitSuggestion = async (text: string) => {
      if (!currentUser || !text.trim()) return;
      await addDoc(collection(db, "suggestions"), {
          user_id: currentUser.id,
          user_name: currentUser.name,
          text: text.trim(),
          created_at: serverTimestamp()
      });
  };
  
  // Admin functions
  const adminSubmitTemplate = async (submissionData: Omit<Template, 'id'|'uploader_id'|'uploader_username'|'status'|'is_active'|'created_at'| 'png_url' | 'bg_preview_url' | 'composite_preview_url'>, files: {pngFile: File, bgFile: File, compositeFile: Blob}) => {
      if(!currentUser || currentUser.role !== Role.ADMIN) return;
      const templateDocRef = doc(collection(db, 'templates'));
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
          created_at: serverTimestamp(),
      };
      await setDoc(templateDocRef, newTemplate);
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
      
      await updateDoc(doc(db, "templates", templateId), updateData);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    const template = templates.find(t => t.id === templateId);
    if(template){
        try { await deleteObject(ref(storage, `templates/${templateId}/overlay.png`)); } catch(e) { console.error(e); }
        try { await deleteObject(ref(storage, `templates/${templateId}/bg_preview.jpg`)); } catch(e) { console.error(e); }
        try { await deleteObject(ref(storage, `templates/${templateId}/composite_preview.jpg`)); } catch(e) { console.error(e); }
    }
    await deleteDoc(doc(db, "templates", templateId));
  };

  const approveTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    await updateDoc(doc(db, "templates", templateId), { status: SubmissionStatus.APPROVED, is_active: true });
  };

  const rejectTemplate = async (templateId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    await updateDoc(doc(db, "templates", templateId), { status: SubmissionStatus.REJECTED, is_active: false });
  };
  
  const addCategory = async (name: CategoryName) => {
    if (!currentUser || currentUser.role !== Role.ADMIN || !name.trim()) return;
    await addDoc(collection(db, "categories"), { name: name.trim() });
  };

  const deleteCategory = async (categoryId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;
    
    const q = query(collection(db, "templates"), where("category", "==", categoryToDelete.name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error('This category is currently in use by one or more templates and cannot be deleted.');
    }

    await deleteDoc(doc(db, "categories", categoryId));
  };
  
  const updateAppSettings = async (settings: Partial<AppSettings>) => {
      if (!currentUser || currentUser.role !== Role.ADMIN) return;
      await setDoc(doc(db, "settings", "app"), settings, { merge: true });
  }
  
  const value = {
    users, templates, bookmarks, savedDesigns, downloads, categories, suggestions, appSettings, currentUser, loading,
    signup, login, startSession, logout,
    getTemplateById, getIsBookmarked, toggleBookmark, getSavedDesignById, saveDesign, addDownload, submitTemplate, getDownloadsForTemplate, updateUsername, submitSuggestion,
    adminSubmitTemplate, updateTemplate, deleteTemplate, approveTemplate, rejectTemplate, addCategory, deleteCategory, updateAppSettings
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