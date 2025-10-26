import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import DownloadPreviewModal from '../../components/user/DownloadPreviewModal';

const UserDownloadsScreen: React.FC = () => {
  const { currentUser, downloads } = useData();
  const myDownloads = downloads
    .filter(d => d.user_id === currentUser?.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="p-4">
        <h1 className="text-xl font-bold text-center text-[#2C3E50] mb-4">Your Downloads</h1>
        {myDownloads.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {myDownloads.map(download => (
              <div 
                key={download.id} 
                className="aspect-square bg-white rounded-[24px] shadow-md p-2 relative cursor-pointer"
                onClick={() => setSelectedImage(download.thumbnail || null)}
              >
                  {download.thumbnail ? (
                      <img src={download.thumbnail} alt="Downloaded creation" className="w-full h-full object-cover rounded-[16px]" />
                  ) : (
                      <div className="w-full h-full bg-gray-200 rounded-[16px] flex items-center justify-center">
                          <p className="text-xs text-gray-500">No Preview</p>
                      </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[30px] mt-4">
            <p className="text-[#7F8C8D]">You haven't downloaded any creations yet.</p>
          </div>
        )}
      </div>
      {selectedImage && (
        <DownloadPreviewModal 
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

export default UserDownloadsScreen;