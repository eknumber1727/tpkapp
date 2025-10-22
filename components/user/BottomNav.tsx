import React from 'react';
import { NavLink } from 'react-router-dom';
import { DownloadIcon, HomeIcon, BookmarkIcon, UserIcon, PlusIcon } from '../shared/Icons';

const BottomNav: React.FC = () => {
  const activeLink = 'text-[#FF7A00]';
  const inactiveLink = 'text-[#7F8C8D]';

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center text-xs gap-1 ${isActive ? activeLink : inactiveLink}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center z-50 rounded-t-[30px]">
      <NavLink to="/" className={getLinkClass}>
        <HomeIcon className="w-6 h-6" />
        <span>Home</span>
      </NavLink>
      <NavLink to="/downloads" className={getLinkClass}>
        <DownloadIcon className="w-6 h-6" />
        <span>Downloads</span>
      </NavLink>
      <NavLink to="/create-template" className="flex items-center justify-center w-16 h-16 -mt-8 bg-gradient-to-br from-[#FFB800] to-[#FF7A00] rounded-full shadow-lg">
        <PlusIcon className="w-8 h-8 text-white" />
      </NavLink>
      <NavLink to="/bookmarks" className={getLinkClass}>
        <BookmarkIcon className="w-6 h-6" />
        <span>Bookmarks</span>
      </NavLink>
      <NavLink to="/profile" className={getLinkClass}>
        <UserIcon className="w-6 h-6" />
        <span>Profile</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;