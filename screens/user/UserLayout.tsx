import React, { useState } from 'react';
import BottomNav from '../../components/user/BottomNav';
import { APP_NAME } from '../../constants';
import { MenuIcon } from '../../components/shared/Icons';
import SideMenu from '../../components/user/SideMenu';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      <header className="sticky top-0 z-40 bg-white px-4 shadow-sm h-16 flex items-center justify-between">
        <button onClick={() => setIsMenuOpen(true)} className="p-2">
            <MenuIcon className="w-6 h-6 text-[#2C3E50]" />
        </button>
        <h1 className="text-xl font-extrabold text-[#2C3E50] text-center tracking-wider">{APP_NAME}</h1>
        <div className="w-8"></div> {/* Spacer to balance the header */}
      </header>
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default UserLayout;