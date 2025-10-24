import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Template, AspectRatio } from '../../types';
import { useData } from '../../context/DataContext';
import { BookmarkIcon, HeartIcon } from '../shared/Icons';

interface TemplateCardProps {
  template: Template;
}

const getAspectRatioClasses = (ratio: AspectRatio) => {
    switch(ratio) {
        case '1:1': return 'aspect-square';
        case '9:16': return 'aspect-[9/16]';
        case '16:9': return 'aspect-[16/9]';
        case '3:4': return 'aspect-[3/4]';
        case '4:5':
        default:
          return 'aspect-[4/5]';
    }
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const navigate = useNavigate();
  const { getIsBookmarked, toggleBookmark, getIsLiked, toggleLike } = useData();
  const isBookmarked = getIsBookmarked(template.id);
  const isLiked = getIsLiked(template.id);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(template.id);
  };
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(template.id);
  };
  
  const handleCreateNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/editor/${template.id}`);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow navigation to creator page
  }

  return (
    <div 
        className="bg-white rounded-[20px] shadow-md overflow-hidden flex flex-col cursor-pointer transition-transform hover:scale-105"
        onClick={handleCreateNow}
    >
      <div className={`relative ${getAspectRatioClasses(template.ratio_default)} bg-gray-200`}>
        {/* FIX: Using a div with background-image for the background is more robust and prevents stretching issues. */}
        <div
            style={{ backgroundImage: `url(${template.bg_preview_url})` }}
            className="absolute inset-0 bg-cover bg-center"
            aria-label={`${template.title} background`}
        ></div>
        <img 
            src={template.png_url} 
            alt={`${template.title} overlay`}
            className="absolute top-0 left-0 w-full h-full object-contain"
            loading="lazy"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={handleLikeClick}
              className={`p-2 rounded-full transition-colors flex items-center gap-1 ${isLiked ? 'text-red-500 bg-white/70 backdrop-blur-sm' : 'text-white bg-black/30 backdrop-blur-sm'}`}
              aria-label="Like template"
            >
              <HeartIcon className="w-5 h-5" isFilled={isLiked} />
              <span className="text-xs font-bold">{template.likeCount || 0}</span>
            </button>
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
            <Link to={`/creator/${template.uploader_id}`} onClick={handleCreatorClick} className="text-xs text-[#7F8C8D] hover:text-[#FF7A00] hover:underline">
                By @{template.uploader_username}
            </Link>
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