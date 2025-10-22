import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { LogoutIcon, MenuIcon, XIcon, DashboardIcon, TemplateManagerIcon, SubmissionsIcon, CategoryIcon, SettingsIcon, SuggestionIcon, BellIcon } from '../../components/shared/Icons';

const NavLinks: React.FC<{ onLinkClick?: () => void }> = ({ onLinkClick }) => {
    const activeClass = "bg-orange-50 text-[#FF7A00]";
    const inactiveClass = "hover:bg-gray-100 text-[#2C3E50]";

    const getLinkClass = ({ isActive }: { isActive: boolean }) =>
        `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? activeClass : inactiveClass}`;

    return (
        <>
            <NavLink to="/" className={getLinkClass} onClick={onLinkClick} end>
                <DashboardIcon className="w-6 h-6" />
                <span>Dashboard</span>
            </NavLink>
            <NavLink to="/templates" className={getLinkClass} onClick={onLinkClick}>
                <TemplateManagerIcon className="w-6 h-6" />
                <span>Templates</span>
            </NavLink>
            <NavLink to="/submissions" className={getLinkClass} onClick={onLinkClick}>
                <SubmissionsIcon className="w-6 h-6" />
                <span>Submissions</span>
            </NavLink>
            <NavLink to="/categories" className={getLinkClass} onClick={onLinkClick}>
                <CategoryIcon className="w-6 h-6" />
                <span>Categories</span>
            </NavLink>
             <NavLink to="/suggestions" className={getLinkClass} onClick={onLinkClick}>
                <SuggestionIcon className="w-6 h-6" />
                <span>Suggestions</span>
            </NavLink>
            <NavLink to="/notifications" className={getLinkClass} onClick={onLinkClick}>
                <BellIcon className="w-6 h-6" />
                <span>Notifications</span>
            </NavLink>
            <NavLink to="/settings" className={getLinkClass} onClick={onLinkClick}>
                <SettingsIcon className="w-6 h-6" />
                <span>App Settings</span>
            </NavLink>
        </>
    );
};

const SidebarContent: React.FC<{ onLinkClick?: () => void }> = ({ onLinkClick }) => {
    const { currentUser, logout } = useData();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <div className="p-4 border-b">
                <h1 className="text-2xl font-bold text-center text-[#2C3E50]">ADMIN</h1>
                {currentUser && <p className="text-center text-sm text-[#7F8C8D] mt-1">Logged in as {currentUser.name}</p>}
            </div>
            <nav className="flex-grow p-4 space-y-2">
                <NavLinks onLinkClick={onLinkClick} />
            </nav>
            <div className="p-4 border-t">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50">
                    <LogoutIcon className="w-6 h-6" />
                    <span>Logout</span>
                </button>
            </div>
        </>
    );
};


interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-[#F8F9FA] min-h-screen">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-white text-[#2C3E50] flex-col h-screen shadow-lg fixed top-0 left-0">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden`}>
                <div className="fixed inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)}></div>
                <aside className="relative w-72 bg-white text-[#2C3E50] flex flex-col h-full shadow-lg z-10">
                    <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <SidebarContent onLinkClick={() => setIsSidebarOpen(false)} />
                </aside>
            </div>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md p-4 z-40 flex items-center">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-center text-[#2C3E50] flex-grow">ADMIN</h1>
            </header>
            
            <main className="flex-grow p-4 sm:p-8 h-full overflow-y-auto lg:ml-64 mt-16 lg:mt-0">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;