import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeftIcon, ShareIcon, ResetIcon, CheckCircleIcon, DownloadIcon } from '../../components/shared/Icons';
import { exportMedia } from '../../utils/helpers';
import { AspectRatio, SavedDesignLayer } from '../../types';
import { ASPECT_RATIOS } from '../../constants';

const DownloadCompleteModal: React.FC<{ onHome: () => void; onContinue: () => void; }> = ({ onHome, onContinue }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-[30px] shadow-lg text-center max-w-sm mx-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-[#2C3E50] mt-4">Success!</h2>
            <p className="text-[#7F8C8D] mt-2 mb-6">Your creation is ready. Use the share menu to save or send it.</p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={onHome}
                    className="w-full text-white font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00]"
                >
                    Back to Home
                </button>
                <button
                    onClick={onContinue}
                    className="w-full text-[#2C3E50] font-semibold py-2"
                >
                    Continue Editing
                </button>
            </div>
        </div>
    </div>
);


const EditorScreen: React.FC = () => {
  const { templateId, designId } = useParams<{ templateId: string, designId?: string }>();
  const navigate = useNavigate();
  const { getTemplateById, getSavedDesignById, saveDesign, addDownload } = useData();

  const template = templateId ? getTemplateById(templateId) : undefined;
  const existingDraft = designId ? getSavedDesignById(designId) : undefined;
  
  const [userMedia, setUserMedia] = useState<{ src: string, type: 'image' | 'video' } | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(template?.ratio_default || '4:5');
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // A simple check for mobile based on Web Share API support
    setIsMobile(!!(navigator.share && navigator.canShare));
  }, []);

  const autoFitMedia = useCallback(() => {
    if (!mediaRef.current || !canvasContainerRef.current) return;
    
    const media = mediaRef.current;
    const container = canvasContainerRef.current;
    
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    const mediaWidth = media instanceof HTMLImageElement ? media.naturalWidth : media.videoWidth;
    const mediaHeight = media instanceof HTMLImageElement ? media.naturalHeight : media.videoHeight;
    
    if (mediaWidth === 0 || mediaHeight === 0) return;
    
    const containerRatio = containerWidth / containerHeight;
    const mediaRatio = mediaWidth / mediaHeight;
    
    let scale;
    // We want to "cover" the container
    if (mediaRatio > containerRatio) {
      // Media is wider, so match height and let width overflow
      scale = containerHeight / mediaHeight;
    } else {
      // Media is taller, so match width and let height overflow
      scale = containerWidth / mediaWidth;
    }
    
    const x = (containerWidth - (mediaWidth * scale)) / 2;
    const y = (containerHeight - (mediaHeight * scale)) / 2;
    
    setTransform({ x, y, scale });
  }, []);

  useEffect(() => {
    if (userMedia && mediaRef.current) {
      const media = mediaRef.current;
      const eventToListen = userMedia.type === 'video' ? 'loadeddata' : 'load';
      
      const handler = () => {
        // If it's a new upload (not from a saved draft), auto-fit it.
        if (!existingDraft) {
          autoFitMedia();
        }
      };
      
      // If media is already loaded (e.g., from cache), run handler immediately
      if ((media instanceof HTMLImageElement && media.complete) || (media instanceof HTMLVideoElement && media.readyState > 0)) {
        handler();
      } else {
        media.addEventListener(eventToListen, handler);
      }
      
      return () => media.removeEventListener(eventToListen, handler);
    }
  }, [userMedia, existingDraft, autoFitMedia]);

  useEffect(() => {
    if (existingDraft && template) {
        setUserMedia({ src: existingDraft.layers_json.bgMediaUrl, type: existingDraft.layers_json.bgType });
        setTransform({ x: existingDraft.layers_json.x, y: existingDraft.layers_json.y, scale: existingDraft.layers_json.scale });
        setActiveRatio(existingDraft.ratio);
    } else if (template) {
        setActiveRatio(template.ratio_default);
    }
  }, [existingDraft, template]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setUserMedia({ src: url, type });
      // The auto-fit logic is now handled by the useEffect hook.
    }
  };
  
  const resetTransform = () => {
      autoFitMedia();
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({ ...prev, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    // FIX: Only zoom if the Ctrl key is pressed to prevent accidental zooming on scroll.
    if (e.ctrlKey) {
        e.preventDefault();
        const scaleAmount = e.deltaY * -0.001;
        setTransform(prev => ({...prev, scale: Math.max(0.1, prev.scale + scaleAmount)}));
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSaveDraft = () => {
    if (!userMedia || !template) return;
    const layers_json: SavedDesignLayer = {
        bgMediaUrl: userMedia.src,
        bgType: userMedia.type,
        ...transform,
        width: mediaRef.current?.offsetWidth || 0,
        height: mediaRef.current?.offsetHeight || 0,
        opacity: 1,
        extraTexts: []
    };
    saveDesign({ id: existingDraft?.id, template_id: template.id, ratio: activeRatio, layers_json });
    alert('Draft Saved!');
  };

  const handleDownload = async () => {
    if (!userMedia || !template || !canvasContainerRef.current || isDownloading) return;

    setIsDownloading(true);

    try {
        const displaySize = { 
            width: canvasContainerRef.current.offsetWidth,
            height: canvasContainerRef.current.offsetHeight
        };
        const canvasSize = { 
            width: displaySize.width * 2, // Export at 2x resolution
            height: displaySize.height * 2
        };

        const blob = await exportMedia(userMedia, template.png_url, transform, canvasSize, displaySize);
        const fileName = 'timepass-katta-creation.png';
        const file = new File([blob], fileName, { type: 'image/png' });

        const onSuccessfulExport = () => {
            const reader = new FileReader();
            reader.onloadend = () => {
                addDownload({ template_id: template.id, design_id: existingDraft?.id || null, local_only: true, thumbnail: reader.result as string });
            }
            reader.readAsDataURL(blob);
            setIsDownloadComplete(true);
        };

        // Use Web Share API for mobile
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'My Timepass Katta Creation',
                text: 'Check out this cool image I made!',
            });
            onSuccessfulExport();
        } else {
            // Fallback for desktop
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            onSuccessfulExport();
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Share canceled by user.');
        } else {
            console.error("Failed to export or share media:", error);
            alert(`Could not create image. Error: ${error.message}`);
        }
    } finally {
        setIsDownloading(false);
    }
  };
  
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

  if (!template) return <div className="p-4 text-center">Template not found.</div>;

  return (
    <>
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
        </button>
        <h1 className="font-bold text-[#2C3E50] text-lg">{template.title}</h1>
        <div className="flex items-center gap-2">
            <button onClick={resetTransform} className="p-2 rounded-full hover:bg-gray-100"><ResetIcon className="w-6 h-6 text-[#2C3E50]" /></button>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center p-4">
        <div
          ref={canvasContainerRef}
          className={`w-full max-w-md bg-gray-200 rounded-[20px] relative overflow-hidden shadow-inner touch-none ${getAspectRatioClasses(activeRatio)}`}
          onWheel={handleWheel}
        >
          {userMedia ? (
            <>
              <div 
                className="absolute top-0 left-0 origin-top-left"
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
              >
                {userMedia.type === 'image' ? (
                  <img ref={mediaRef as React.RefObject<HTMLImageElement>} src={userMedia.src} alt="User upload" className="pointer-events-none max-w-none" />
                ) : (
                  <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={userMedia.src} autoPlay muted loop className="pointer-events-none max-w-none" />
                )}
              </div>
              <img src={template.png_url} alt="Template overlay" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none z-10" />
            </>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center">
              <label htmlFor="upload-media" className="cursor-pointer bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-bold py-3 px-6 rounded-full shadow-lg">
                Upload Photo/Video
              </label>
              <input type="file" id="upload-media" className="hidden" onChange={handleMediaUpload} accept="image/*,video/*" />
            </div>
          )}
        </div>
        
        <div className="w-full max-w-md mt-4">
            <div className="flex justify-center gap-2 mb-4">
                {template.ratios_supported.map(ratio => (
                    <button key={ratio} onClick={() => setActiveRatio(ratio)} className={`px-3 py-1 text-sm rounded-full ${activeRatio === ratio ? 'bg-[#2C3E50] text-white' : 'bg-white text-[#2C3E50]'}`}>{ratio}</button>
                ))}
            </div>

            <div className="flex gap-2">
                <button onClick={handleSaveDraft} disabled={!userMedia} className="w-full text-center p-3 rounded-[20px] bg-white text-[#2C3E50] font-bold disabled:opacity-50 shadow-sm">Save Draft</button>
                <button onClick={handleDownload} disabled={!userMedia || isDownloading} className="w-full text-center p-3 rounded-[20px] bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {isDownloading ? 'Processing...' : (
                        isMobile ? (
                            <>
                                <ShareIcon className="w-6 h-6" />
                                <span>Share / Save</span>
                            </>
                        ) : (
                            <>
                                <DownloadIcon className="w-6 h-6" />
                                <span>Download Now</span>
                            </>
                        )
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
    {isDownloadComplete && (
        <DownloadCompleteModal 
            onHome={() => {
                setIsDownloadComplete(false);
                navigate('/');
            }}
            onContinue={() => setIsDownloadComplete(false)}
        />
    )}
    </>
  );
};

export default EditorScreen;