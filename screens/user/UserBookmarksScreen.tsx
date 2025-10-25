import React from 'react';
import { useData } from '../../context/DataContext';
import TemplateCard from '../../components/user/TemplateCard';

const UserBookmarksScreen: React.FC = () => {
  const { bookmarkedTemplates } = useData();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-center text-[#2C3E50] mb-4">My Bookmarks</h1>
      {bookmarkedTemplates.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {bookmarkedTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[30px] mt-4">
          <p className="text-[#7F8C8D]">You haven't bookmarked any templates yet.</p>
        </div>
      )}
    </div>
  );
};

export default UserBookmarksScreen;