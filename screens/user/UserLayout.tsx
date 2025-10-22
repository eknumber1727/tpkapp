import React from 'react';
import BottomNav from '../../components/user/BottomNav';
import { APP_NAME } from '../../constants';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      <header className="sticky top-0 z-40 bg-white px-4 shadow-sm h-16 flex items-center justify-center">
        <h1 className="text-xl font-extrabold text-[#2C3E50] text-center tracking-wider">{APP_NAME}</h1>
      </header>
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default UserLayout;