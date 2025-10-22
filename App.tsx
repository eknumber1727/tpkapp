import React from 'react';
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

import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminTemplateManagerScreen from './screens/admin/AdminTemplateManagerScreen';
import AdminSubmissionsManagerScreen from './screens/admin/AdminSubmissionsManagerScreen';
import AdminLayout from './screens/admin/AdminLayout';
import AdminEditTemplateScreen from './screens/admin/AdminEditTemplateScreen';
import { Role } from './types';
import AdminCategoryManagerScreen from './screens/admin/AdminCategoryManagerScreen';
import AdminAppSettingsManagerScreen from './screens/admin/AppSettingsManagerScreen';
import AdminSuggestionsScreen from './screens/admin/AdminSuggestionsScreen';

const UserRoutes = () => (
  <UserLayout>
    <Routes>
      <Route path="/" element={<UserHomeScreen />} />
      <Route path="/bookmarks" element={<UserBookmarksScreen />} />
      <Route path="/downloads" element={<UserDownloadsScreen />} />
      <Route path="/profile" element={<UserProfileScreen />} />
      <Route path="/saved-designs" element={<UserSavedDesignsScreen />} />
      <Route path="/create-template" element={<UserCreateTemplateScreen />} />
      <Route path="/editor/:templateId" element={<EditorScreen />} />
      <Route path="/editor/:templateId/draft/:designId" element={<EditorScreen />} />
      <Route path="/about" element={<AboutUsScreen />} />
      <Route path="/terms" element={<TermsScreen />} />
      <Route path="/contact" element={<ContactUsScreen />} />
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
      <Route path="/settings" element={<AdminAppSettingsManagerScreen />} />
      <Route path="/create-template" element={<UserCreateTemplateScreen />} />
      <Route path="/templates/:templateId/edit" element={<AdminEditTemplateScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AdminLayout>
);

const App: React.FC = () => {
  const { currentUser } = useData();

  return (
    <HashRouter>
      {!currentUser ? (
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : currentUser.role === Role.ADMIN ? (
        <AdminRoutes />
      ) : (
        <UserRoutes />
      )}
    </HashRouter>
  );
};

export default App;