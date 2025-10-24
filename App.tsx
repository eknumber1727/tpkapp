import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useData } from './context/DataContext';

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
  const { currentUser, appSettings } = useData();

  useEffect(() => {
    // Dynamically load Google AdSense script if enabled
    if (appSettings.adsEnabled && appSettings.adSensePublisherId) {
      const scriptId = 'adsense-script';
      if (document.getElementById(scriptId)) {
        return; // Script already added
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${appSettings.adSensePublisherId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [appSettings.adsEnabled, appSettings.adSensePublisherId]);

  useEffect(() => {
    const faviconUrl = appSettings.faviconUrl;
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [appSettings.faviconUrl]);

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