import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import { firebaseConfig } from './firebase'; // Import the config

import LoginScreen from './screens/LoginScreen';
import UserHomeScreen from './screens/user/UserHomeScreen';
import UserBookmarksScreen from './screens/user/UserBookmarksScreen';
import UserDownloadsScreen from './screens/user/UserDownloadsScreen';
import UserProfileScreen from './screens/user/UserProfileScreen';
import UserCreateTemplateScreen from './screens/user/UserCreateTemplateScreen';
import UserSavedDesignsScreen from './screens/user/UserSavedDesignsScreen';
import EditorScreen from './screens/user/EditorScreen';
import UserLayout from './screens/user/UserLayout';
import AboutUsScreen from './screens/user/AboutUsScreen';
import TermsScreen from './screens/user/TermsScreen';
import ContactUsScreen from './screens/user/ContactUsScreen';
import CreatorProfileScreen from './screens/user/CreatorProfileScreen';
import UserNotificationsScreen from './screens/user/UserNotificationsScreen';

import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminTemplateManagerScreen from './screens/admin/AdminTemplateManagerScreen';
import AdminSubmissionsManagerScreen from './screens/admin/AdminSubmissionsManagerScreen';
import AdminLayout from './screens/admin/AdminLayout';
import AdminEditTemplateScreen from './screens/admin/AdminEditTemplateScreen';
import { Role } from './types';
import AdminCategoryManagerScreen from './screens/admin/AdminCategoryManagerScreen';
import AdminSuggestionsScreen from './screens/admin/AdminSuggestionsScreen';
import AdminNotificationsManagerScreen from './screens/admin/AdminNotificationsManagerScreen';

const UserRoutes = () => (
  <UserLayout>
    <Routes>
      <Route path="/" element={<UserHomeScreen />} />
      <Route path="/bookmarks" element={<UserBookmarksScreen />} />
      <Route path="/downloads" element={<UserDownloadsScreen />} />
      <Route path="/profile" element={<UserProfileScreen />} />
      <Route path="/saved-designs" element={<UserSavedDesignsScreen />} />
      <Route path="/create-template" element={<UserCreateTemplateScreen />} />
      <Route path="/creator/:creatorId" element={<CreatorProfileScreen />} />
      <Route path="/editor/:templateId" element={<EditorScreen />} />
      <Route path="/editor/:templateId/draft/:designId" element={<EditorScreen />} />
      <Route path="/about" element={<AboutUsScreen />} />
      <Route path="/terms" element={<TermsScreen />} />
      <Route path="/contact" element={<ContactUsScreen />} />
      <Route path="/notifications" element={<UserNotificationsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </UserLayout>
);

const AdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route path="/" element={<AdminDashboardScreen />} />
      <Route path="/templates" element={<AdminTemplateManagerScreen />} />
      <Route path="/submissions" element={<AdminSubmissionsManagerScreen />} />
      <Route path="/categories" element={<AdminCategoryManagerScreen />} />
      <Route path="/suggestions" element={<AdminSuggestionsScreen />} />
      <Route path="/notifications" element={<AdminNotificationsManagerScreen />} />
      <Route path="/create-template" element={<UserCreateTemplateScreen />} />
      <Route path="/templates/:templateId/edit" element={<AdminEditTemplateScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AdminLayout>
);

const App: React.FC = () => {
  const { currentUser, appSettings, loading } = useData();

  React.useEffect(() => {
    // Register the Firebase messaging service worker securely
    if ('serviceWorker' in navigator && firebaseConfig.apiKey) {
      const firebaseConfigParams = encodeURIComponent(JSON.stringify(firebaseConfig));
      navigator.serviceWorker
        .register(`/firebase-messaging-sw.js?firebaseConfig=${firebaseConfigParams}`)
        .then((registration) => {
          console.log('Service Worker registration successful, scope is:', registration.scope);
        })
        .catch((err) => {
          console.log('Service Worker registration failed:', err);
        });
    }
  }, []);

  // Display a loading indicator or a message if Firebase config is missing
  if (!firebaseConfig.apiKey) {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Configuration Error</h1>
            <p>Firebase configuration is missing. Please set up your environment variables.</p>
        </div>
    );
  }

  // Show a global loading spinner while Firebase auth is initializing
  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#FF7A00]"></div>
          </div>
      );
  }

  const renderRoutes = () => {
    if (!currentUser) {
      return (
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }

    if (currentUser.role === Role.ADMIN) {
        return <AdminRoutes />;
    }

    return <UserRoutes />;
  };

  return (
    <HashRouter>
      {renderRoutes()}
    </HashRouter>
  );
};

export default App;