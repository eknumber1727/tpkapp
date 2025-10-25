import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { SavedDesign, SavedDesignData } from '../../types';

const UserSavedDesignsScreen: React.FC = () => {
  const { currentUser, savedDesigns, getTemplateById } = useData();
  const navigate = useNavigate();
  const myDesigns = savedDesigns.filter(d => d.user_id === currentUser?.id);

  const getTemplatePreview = (templateId: string) => {
      return getTemplateById(templateId)?.composite_preview_url;
  }
  
  const handleEditDraft = (design: SavedDesign) => {
      navigate(`/editor/${design.template_id}/draft/${design.id}`);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-center text-[#2C3E50] mb-4">Your Saved Designs</h1>
      {myDesigns.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {myDesigns.map(design => (
            <div key={design.id} className="aspect-[4/5] bg-gray-100 rounded-[24px] shadow-md p-2 cursor-pointer relative" onClick={() => handleEditDraft(design)}>
                <img src={getTemplatePreview(design.template_id)} alt="Template preview" className="w-full h-full object-contain" />
                <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs text-center p-1 rounded-full">
                    Draft
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[30px] mt-4">
          <p className="text-[#7F8C8D]">You have no saved designs.</p>
        </div>
      )}
    </div>
  );
};

export default UserSavedDesignsScreen;