import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeftIcon, ShareIcon, ResetIcon, CheckCircleIcon, DownloadIcon, VolumeOffIcon, VolumeUpIcon } from '../../components/shared/Icons';
import { exportMedia } from '../../utils/helpers';
import { AspectRatio, SavedDesignData } from '../../types';
import { ASPECT_RATIOS } from '../../constants';

const DownloadCompleteModal: React.FC<{ 
    onHome: () => void; 
    onContinue: () => void; 
    onShare?: () => void; 
    canShare: boolean;
}> = ({ onHome, onContinue, onShare, canShare }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-[30px] shadow-lg text-center max-w-sm mx-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-[#2C3E50] mt-4">Success!</h2>
            <p className="text-[#7F8C8D] mt-2 mb-6">Your creation has been processed.</p>
            <div className="flex flex-col gap-3">
                 {canShare && onShare && (
                    <button
                        onClick={onShare}
                        className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg bg-blue-500"
                    >
                        <ShareIcon className="w-5 h-5" />
                        Share Now
                    </button>
                )}
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
  const { getTemplateById, getSavedDesignById, saveDesign, addDownload, appSettings } = useData();

  const template = templateId ? getTemplateById(templateId) : undefined;
  const existingDraft = designId ? getSavedDesignById(designId) : undefined;
  
  // Editor State
  const [bgMedia, setBgMedia] = useState<SavedDesignData['bgMedia'] | null>(null);
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(template?.ratio_default || '4:5');
  
  // UI State
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);
  
  // Interaction Refs
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const interactionState = useRef({
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      isPinching: false,
      initialPinchDist: 0,
      initialScale: 1,
  }).current;

  // Load draft or set defaults
  useEffect(() => {
    if (existingDraft && template) {
        const designData = typeof existingDraft.layers_json === 'string' 
            ? JSON.parse(existingDraft.layers_json) as SavedDesignData
            : existingDraft.layers_json;

        setBgMedia(designData.bgMedia);
        setActiveRatio(existingDraft.ratio);
    } else if (template) {
        setActiveRatio(template.ratio_default);
    }
  }, [existingDraft, template]);

  const autoFitMedia = useCallback(() => {
    if (!mediaRef.current || !canvasContainerRef.current || !bgMedia) return;
    
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
    if (mediaRatio > containerRatio) { // Media is wider than container
      scale = containerHeight / mediaHeight;
    } else { // Media is taller or same ratio
      scale = containerWidth / mediaWidth;
    }
    
    const x = (containerWidth - (mediaWidth * scale)) / 2;
    const y = (containerHeight - (mediaHeight * scale)) / 2;
    
    setBgMedia(prev => prev ? ({ ...prev, x, y, scale }) : null);
  }, [bgMedia]);

  useEffect(() => {
    if (bgMedia && mediaRef.current) {
      const media = mediaRef.current;
      const eventToListen = bgMedia.type === 'video' ? 'loadeddata' : 'load';
      
      const handler = () => {
        if (!existingDraft) {
          autoFitMedia();
        }
      };
      
      // Check if media is already loaded
      if ((media instanceof HTMLImageElement && media.complete) || (media instanceof HTMLVideoElement && media.readyState > 2)) {
        handler();
      } else {
        media.addEventListener(eventToListen, handler);
      }
      
      return () => media.removeEventListener(eventToListen, handler);
    }
  }, [bgMedia?.src, existingDraft, autoFitMedia]);

  useEffect(() => {
    if (bgMedia?.type === 'video' && mediaRef.current) {
        const videoElement = mediaRef.current as HTMLVideoElement;
        videoElement.muted = bgMedia.muted ?? true; // Default to muted
        videoElement.setAttribute('playsinline', 'true');
        videoElement.play().catch(error => console.warn("Video autoplay was prevented by the browser.", error));
    }
  }, [bgMedia?.src, bgMedia?.muted]);


  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setBgMedia({ src: url, type, x: 0, y: 0, scale: 1, muted: true });
    }
  };
  
  const resetTransform = () => autoFitMedia();

  const toggleMute = () => {
      if (bgMedia?.type === 'video') {
          setBgMedia(prev => prev ? ({...prev, muted: !prev.muted}) : null);
      }
  }
  
  // --- Interaction Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return; // Ignore events from children (like mute button)
    interactionState.isDragging = true;
    interactionState.dragStart = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (interactionState.isDragging && bgMedia) {
        const dx = e.clientX - interactionState.dragStart.x;
        const dy = e.clientY - interactionState.dragStart.y;
        interactionState.dragStart = { x: e.clientX, y: e.clientY };
        setBgMedia(prev => prev ? ({ ...prev, x: prev.x + dx, y: prev.y + dy }) : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    interactionState.isDragging = false;
    (e.target as HTMLElement).style.cursor = 'grab';
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey && bgMedia) {
        e.preventDefault();
        const scaleAmount = e.deltaY * -0.001;
        setBgMedia(prev => prev ? ({...prev, scale: Math.max(0.1, prev.scale + scaleAmount)}) : null);
    }
  };
  
    const handleTouchStart = (e: React.TouchEvent) => {
        const touches = e.touches;
        // Only trigger interactions if the event starts on the container itself
        if (e.target !== e.currentTarget) return;

        // Allow page scroll by default unless we start a pan/pinch
        if (touches.length === 2 && bgMedia) {
            e.preventDefault();
            interactionState.isPinching = true;
            interactionState.initialPinchDist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
            interactionState.initialScale = bgMedia.scale;
        } else if (touches.length === 1) {
            e.preventDefault();
            interactionState.isDragging = true;
            interactionState.dragStart = { x: touches[0].clientX, y: touches[0].clientY };
        }
    }
    
    const handleTouchMove = (e: React.TouchEvent) => {
        const touches = e.touches;
        if (interactionState.isPinching || interactionState.isDragging) {
            e.preventDefault();
        }

        if (interactionState.isPinching && touches.length === 2 && bgMedia) {
            const currentDist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
            const scale = (currentDist / interactionState.initialPinchDist) * interactionState.initialScale;
            setBgMedia(prev => prev ? ({ ...prev, scale: Math.max(0.1, scale) }) : null);
        } else if (interactionState.isDragging && touches.length === 1 && bgMedia) {
            const dx = touches[0].clientX - interactionState.dragStart.x;
            const dy = touches[0].clientY - interactionState.dragStart.y;
            interactionState.dragStart = { x: touches[0].clientX, y: touches[0].clientY };
            setBgMedia(prev => prev ? ({...prev, x: prev.x + dx, y: prev.y + dy}) : null);
        }
    }
    
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length < 2) interactionState.isPinching = false;
        if (e.touches.length < 1) interactionState.isDragging = false;
    }
  
  const handleSaveDraft = () => {
    if (!bgMedia || !template) return;
    const designData: SavedDesignData = { bgMedia };
    saveDesign({ id: existingDraft?.id, template_id: template.id, ratio: activeRatio, layers_json: designData });
    alert('Draft Saved!');
  };
  
  const handleShareFromModal = async () => {
    if (!generatedFile || !navigator.share) return;
    try {
        await navigator.share({
            files: [generatedFile],
            title: 'My Timepass Katta Creation',
            text: 'make your creative now visit: www.timepasskatta.app',
        });
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            console.error("Share failed:", error);
            alert("Could not share creation.");
        }
    }
  };

  const handleDownload = async () => {
    if (!bgMedia || !template || !canvasContainerRef.current || isProcessing) return;
    setIsProcessing(true);
    setProcessingStatus('Initializing...');
    setGeneratedFile(null);

    try {
        const designData: SavedDesignData = { bgMedia };
        const displaySize = { 
            width: canvasContainerRef.current.offsetWidth,
            height: canvasContainerRef.current.offsetHeight
        };
        // Use a higher resolution for export
        const exportWidth = 1080;
        const exportHeight = exportWidth / (displaySize.width / displaySize.height);
        const canvasSize = { width: exportWidth, height: exportHeight };

        const { blob, fileType } = await exportMedia(designData, template.png_url, appSettings, canvasSize, displaySize, setProcessingStatus);
        
        const extension = fileType === 'video' ? 'mp4' : 'jpg';
        const mimeType = fileType === 'video' ? 'video/mp4' : 'image/jpeg';
        const fileName = `timepass-katta-creation.${extension}`;
        const file = new File([blob], fileName, { type: mimeType });

        const onSuccessfulExport = () => {
            // Generate a thumbnail for the downloads page
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 200;
            thumbCanvas.height = 200;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
                const tempUrl = URL.createObjectURL(blob);
                if (fileType === 'image') {
                    const img = new Image();
                    img.onload = () => {
                        thumbCtx.drawImage(img, 0, 0, 200, 200);
                        addDownload({ template_id: template.id, design_id: existingDraft?.id || null, local_only: true, thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.8) });
                        URL.revokeObjectURL(tempUrl);
                    };
                    img.src = tempUrl;
                } else {
                    const video = document.createElement('video');
                    video.onloadeddata = () => {
                        video.currentTime = 0;
                    };
                    video.onseeked = () => {
                         thumbCtx.drawImage(video, 0, 0, 200, 200);
                         addDownload({ template_id: template.id, design_id: existingDraft?.id || null, local_only: true, thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.8) });
                         URL.revokeObjectURL(tempUrl);
                    };
                    video.src = tempUrl;
                }
            } else {
                addDownload({ template_id: template.id, design_id: existingDraft?.id || null, local_only: true, thumbnail: undefined });
            }
             setIsDownloadComplete(true);
        };
        
        const canShare = navigator.share && navigator.canShare({ files: [file] });

        if (canShare) {
            setGeneratedFile(file);
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
        onSuccessfulExport();

    } catch (error: any) {
        console.error("Failed to export media:", error);
        alert(`Could not create file. Error: ${error.message}`);
    } finally {
        setIsProcessing(false);
        setProcessingStatus('');
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
  
  const canShare = !!navigator.share;

  if (!template) return <div className="p-4 text-center">Template not found.</div>;

  return (
    <>
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-30">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
        </button>
        <h1 className="font-bold text-[#2C3E50] text-lg">{template.title}</h1>
        <div className="flex items-center gap-2">
            <button onClick={resetTransform} className="p-2 rounded-full hover:bg-gray-100"><ResetIcon className="w-6 h-6 text-[#2C3E50]" /></button>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center p-4">
        {/* Editor Canvas */}
        <div
          ref={canvasContainerRef}
          className={`w-full max-w-md bg-gray-200 rounded-[20px] relative overflow-hidden shadow-inner ${getAspectRatioClasses(activeRatio)}`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: bgMedia ? 'grab' : 'default' }}
        >
          {bgMedia ? (
            <>
              {/* Background Media */}
              <div 
                className="absolute top-0 left-0 origin-top-left"
                style={{ transform: `translate(${bgMedia.x}px, ${bgMedia.y}px) scale(${bgMedia.scale})` }}
              >
                {bgMedia.type === 'image' ? (
                  <img ref={mediaRef as React.RefObject<HTMLImageElement>} src={bgMedia.src} alt="User upload" className="pointer-events-none max-w-none" />
                ) : (
                  <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={bgMedia.src} autoPlay muted loop playsInline className="pointer-events-none max-w-none" />
                )}
              </div>
              
              {/* Mute Button for Video */}
              {bgMedia.type === 'video' && (
                <button onClick={toggleMute} className="absolute top-3 left-3 bg-black/40 text-white p-2 rounded-full backdrop-blur-sm z-20">
                    {bgMedia.muted ? <VolumeOffIcon className="w-5 h-5" /> : <VolumeUpIcon className="w-5 h-5" />}
                </button>
              )}

              {/* Template Overlay */}
              <img src={template.png_url} alt="Template overlay" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none z-10" />
            </>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center">
              <label htmlFor="upload-media" className="cursor-pointer bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2C11] font-bold py-3 px-6 rounded-full shadow-lg">
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
                <button onClick={handleSaveDraft} disabled={!bgMedia} className="w-full text-center p-3 rounded-[20px] bg-white text-[#2C3E50] font-bold disabled:opacity-50 shadow-sm">Save Draft</button>
                <button onClick={handleDownload} disabled={!bgMedia || isProcessing} className="w-full text-center p-3 rounded-[20px] bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2C11] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {isProcessing ? (processingStatus || 'Processing...') : (
                        canShare ? (
                            <> <ShareIcon className="w-5 h-5" /> <span>Share & Save</span> </>
                        ) : (
                            <> <DownloadIcon className="w-5 h-5" /> <span>Download</span> </>
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
            onShare={handleShareFromModal}
            canShare={!!generatedFile && canShare}
        />
    )}
    </>
  );
};

export default EditorScreen;