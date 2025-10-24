import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { CategoryIcon, XIcon } from '../shared/Icons';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { categories } = useData();

    const handleCategoryClick = (categoryName: string | 'All') => {
        navigate('/', { state: { selectedCategory: categoryName } });
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            {/* Menu Content */}
            <div className="relative w-72 max-w-[80vw] bg-white text-[#2C3E50] flex flex-col h-full shadow-lg z-10">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Categories</h2>
                    <button onClick={onClose} className="p-2">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => handleCategoryClick('All')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                    >
                        <CategoryIcon className="w-6 h-6" />
                        <span>All Templates</span>
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                        >
                            <CategoryIcon className="w-6 h-6" />
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </nav>
                 <div className="p-2 border-t">
                    <Link to="/about" onClick={onClose} className="block p-3 text-[#2C3E50] font-semibold hover:bg-gray-100 rounded-lg">About Us</Link>
                    <Link to="/terms" onClick={onClose} className="block p-3 text-[#2C3E50] font-semibold hover:bg-gray-100 rounded-lg">Terms & Conditions</Link>
                    <Link to="/contact" onClick={onClose} className="block p-3 text-[#2C3E50] font-semibold hover:bg-gray-100 rounded-lg">Contact Us</Link>
                </div>
            </div>
        </div>
    );
};

export default SideMenu;
