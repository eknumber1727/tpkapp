import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import TemplateCard from '../../components/user/TemplateCard';
import { ChevronLeftIcon } from '../../components/shared/Icons';
import { Template } from '../../types';
import TemplateCardSkeleton from '../../components/user/TemplateCardSkeleton';

const CreatorProfileScreen: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { users, getTemplatesByCreatorId } = useData();
  const navigate = useNavigate();
  
  const [creatorTemplates, setCreatorTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const creator = useMemo(() => {
    return users.find(user => user.id === creatorId);
  }, [users, creatorId]);
  
  useEffect(() => {
      if (creatorId) {
          setLoading(true);
          getTemplatesByCreatorId(creatorId)
              .then(data => {
                  setCreatorTemplates(data);
              })
              .catch(error => {
                  console.error("Failed to fetch creator templates:", error);
              })
              .finally(() => {
                  setLoading(false);
              });
      }
  }, [creatorId, getTemplatesByCreatorId]);


  if (!creator && !loading) {
    return <div className="p-4 text-center">Creator not found.</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6 relative">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 absolute left-0">
            <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
        </button>
        <div className="flex-grow flex flex-col items-center">
            {creator ? (
                <>
                    <img src={creator.photo_url} alt={creator.name} className="w-20 h-20 rounded-full shadow-lg border-4 border-white" />
                    <h1 className="text-2xl font-bold text-[#2C3E50] mt-3">@{creator.name}</h1>
                    <p className="text-sm text-[#7F8C8D]">{creatorTemplates.length} templates</p>
                </>
            ) : (
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-200"></div>
                    <div className="h-8 bg-gray-200 rounded-md w-40 mt-3"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-24 mt-2"></div>
                </div>
            )}
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <TemplateCardSkeleton key={i} />)}
        </div>
      ) : creatorTemplates.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {creatorTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[30px] mt-4">
          <p className="text-[#7F8C8D]">This creator hasn't published any templates yet.</p>
        </div>
      )}
    </div>
  );
};

export default CreatorProfileScreen;