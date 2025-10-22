import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Template } from '../../types';
import { useData } from '../../context/DataContext';
import { BookmarkIcon } from '../shared/Icons';

interface TemplateCardProps {
  template: Template;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const navigate = useNavigate();
  const { getIsBookmarked, toggleBookmark } = useData();
  const isBookmarked = getIsBookmarked(template.id);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(template.id);
  };
  
  const handleCreateNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/editor/${template.id}`);
  };

  return (
    <div 
        className="bg-white rounded-[20px] shadow-md overflow-hidden flex flex-col cursor-pointer transition-transform hover:scale-105"
        onClick={handleCreateNow}
    >
      <div className="relative aspect-[4/5] bg-gray-100">
        <img 
            src={template.composite_preview_url} 
            alt={template.title} 
            className="w-full h-full object-cover"
            loading="lazy"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={handleBookmarkClick}
              className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-[#FF7A00] bg-white/70 backdrop-blur-sm' : 'text-white bg-black/30 backdrop-blur-sm'}`}
              aria-label="Bookmark template"
            >
              <BookmarkIcon
                className="w-5 h-5"
                isFilled={isBookmarked}
              />
            </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#2C3E50] truncate">{template.title}</h3>
        <div className="flex justify-between items-center">
            <p className="text-sm text-[#7F8C8D]">{template.category}</p>
            <p className="text-xs text-[#7F8C8D]">By @{template.uploader_username}</p>
        </div>
        <button
          onClick={handleCreateNow}
          className="w-full mt-3 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-bold text-sm"
        >
          Create Now
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;