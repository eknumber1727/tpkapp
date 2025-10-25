import React from 'react';
import { XIcon, DownloadIcon, ShareIcon } from '../shared/Icons';

interface DownloadPreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
};

const DownloadPreviewModal: React.FC<DownloadPreviewModalProps> = ({ imageUrl, onClose }) => {

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `timepass-katta-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        try {
            const blob = await dataUrlToBlob(imageUrl);
            const file = new File([blob], 'creation.png', { type: 'image/png' });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'My Timepass Katta Creation',
                    text: 'make your creative now visit: www.timepasskatta.app',
                });
            } else {
                alert("Sharing is not supported on this device, or there's nothing to share.");
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Could not share the image.');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
            onClick={onClose}
        >
            <div
                className="relative p-4 bg-white rounded-lg shadow-xl max-w-lg w-[90vw] max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-700 hover:text-black z-10"
                    aria-label="Close image preview"
                >
                    <XIcon className="w-5 h-5" />
                </button>
                <div className="flex-grow flex items-center justify-center overflow-hidden">
                    <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 pt-4 flex gap-2 justify-center">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-[#2C3E50] font-semibold">
                        <DownloadIcon className="w-5 h-5" />
                        Download Again
                    </button>
                    {navigator.share && (
                        <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] rounded-lg font-semibold">
                            <ShareIcon className="w-5 h-5" />
                            Share
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DownloadPreviewModal;
