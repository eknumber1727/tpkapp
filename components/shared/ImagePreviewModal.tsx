import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="relative p-4 bg-white rounded-lg shadow-xl max-w-3xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-700 hover:text-black"
          aria-label="Close image preview"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <img src={imageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
      </div>
    </div>
  );
};

export default ImagePreviewModal;