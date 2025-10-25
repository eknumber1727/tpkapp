import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeftIcon, ShareIcon, ResetIcon, CheckCircleIcon, DownloadIcon, TrashIcon } from '../../components/shared/Icons';
import { exportMedia } from '../../utils/helpers';
import { AspectRatio, SavedDesignData, Layer, TextLayer, StickerLayer, Sticker } from '../../types';
import { ASPECT_RATIOS } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

const FONT_FACES = ['Poppins', 'Lobster', 'Pacifico', 'Caveat', 'Roboto Slab'];

const DownloadCompleteModal: React.FC<{ onHome: () => void; onContinue: () => void; }> = ({ onHome, onContinue }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
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

const StickerModal: React.FC<{ onClose: () => void; onSelect: (sticker: Sticker) => void }> = ({ onClose, onSelect }) => {
    const { stickers } = useData();
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-[30px] shadow-lg max-w-lg w-11/12 h-3/4 flex flex-col p-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-[#2C3E50] mb-4 text-center">Select a Sticker</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto p-2 flex-grow">
                    {stickers.map(sticker => (
                        <button key={sticker.id} onClick={() => onSelect(sticker)} className="aspect-square bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition">
                            <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

const EditorScreen: React.FC = () => {
  const { templateId, designId } = useParams<{ templateId: string, designId?: string }>();
  const navigate = useNavigate();
  const { getTemplateById, getSavedDesignById, saveDesign, addDownload, appSettings } = useData();

  const template = templateId ? getTemplateById(templateId) : undefined;
  const existingDraft = designId ? getSavedDesignById(designId) : undefined;
  
  // Editor State
  const [bgMedia, setBgMedia] = useState<SavedDesignData['bgMedia'] | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(template?.ratio_default || '4:5');
  
  // UI State
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  
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
        // Handle both string and object formats for backward compatibility
        const designData = typeof existingDraft.layers_json === 'string' 
            ? JSON.parse(existingDraft.layers_json) as SavedDesignData
            : existingDraft.layers_json;

        setBgMedia(designData.bgMedia);
        setLayers(designData.layers || []);
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
    if (mediaRatio > containerRatio) { // Media is wider
      scale = containerHeight / mediaHeight;
    } else { // Media is taller
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
      
      if ((media instanceof HTMLImageElement && media.complete) || (media instanceof HTMLVideoElement && media.readyState > 0)) {
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
        videoElement.muted = true;
        videoElement.play().catch(error => console.warn("Video autoplay prevented.", error));
    }
  }, [bgMedia?.src]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setBgMedia({ src: url, type, x: 0, y: 0, scale: 1 });
    }
  };
  
  const resetTransform = () => autoFitMedia();
  
  // --- Layer Management ---
  const bringLayerToFront = (layerId: string) => {
    setLayers(prevLayers => {
        const layerToMove = prevLayers.find(l => l.id === layerId);
        if (!layerToMove) return prevLayers;
        const otherLayers = prevLayers.filter(l => l.id !== layerId);
        return [...otherLayers, layerToMove];
    });
  };

  const addTextLayer = () => {
      const newTextLayer: TextLayer = {
          id: uuidv4(),
          type: 'text',
          text: 'Hello World',
          fontFamily: 'Poppins',
          fontSize: 40,
          color: '#FFFFFF',
          x: 150,
          y: 150,
          scale: 1,
          rotation: 0,
          width: 200, // default width
      };
      setLayers(prev => [...prev, newTextLayer]);
      setSelectedLayerId(newTextLayer.id);
  }

  const addStickerLayer = (sticker: Sticker) => {
    const newStickerLayer: StickerLayer = {
      id: uuidv4(),
      type: 'sticker',
      stickerId: sticker.id,
      src: sticker.url,
      x: 150,
      y: 150,
      scale: 1,
      rotation: 0,
      width: 100, // Default size
      height: 100,
    };
    setLayers(prev => [...prev, newStickerLayer]);
    setSelectedLayerId(newStickerLayer.id);
    setIsStickerModalOpen(false);
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
      setLayers(prev => prev.map(l => l.id === layerId ? ({ ...l, ...updates } as Layer) : l));
  }
  
  const deleteLayer = (layerId: string) => {
      setLayers(prev => prev.filter(l => l.id !== layerId));
      setSelectedLayerId(null);
  }

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // --- Interaction Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return; // Prevent events on children (layers)
    interactionState.isDragging = true;
    interactionState.dragStart = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (interactionState.isDragging && bgMedia) {
        const dx = e.clientX - interactionState.dragStart.x;
        const dy = e.clientY - interactionState.dragStart.y;
        interactionState.dragStart = { x: e.clientX, y: e.clientY };
        setBgMedia(prev => prev ? ({ ...prev, x: prev.x + dx, y: prev.y + dy }) : null);
    }
  };

  const handlePointerUp = () => {
    interactionState.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey && bgMedia) { // Desktop zoom
        e.preventDefault();
        const scaleAmount = e.deltaY * -0.001;
        setBgMedia(prev => prev ? ({...prev, scale: Math.max(0.1, prev.scale + scaleAmount)}) : null);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && bgMedia) { // Pinching
        e.preventDefault();
        interactionState.isPinching = true;
        interactionState.initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        interactionState.initialScale = bgMedia.scale;
    } else if (e.touches.length === 1 && e.target === e.currentTarget) { // Panning
        e.preventDefault();
        interactionState.isDragging = true;
        interactionState.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
      if (interactionState.isPinching && e.touches.length === 2 && bgMedia) {
          e.preventDefault();
          const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          const scale = (currentDist / interactionState.initialPinchDist) * interactionState.initialScale;
          setBgMedia(prev => prev ? ({ ...prev, scale: Math.max(0.1, scale) }) : null);
      } else if (interactionState.isDragging && e.touches.length === 1 && bgMedia) {
          e.preventDefault();
          const dx = e.touches[0].clientX - interactionState.dragStart.x;
          const dy = e.touches[0].clientY - interactionState.dragStart.y;
          interactionState.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          setBgMedia(prev => prev ? ({...prev, x: prev.x + dx, y: prev.y + dy}) : null);
      }
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (e.touches.length < 2) interactionState.isPinching = false;
      if (e.touches.length < 1) interactionState.isDragging = false;
  }
  
  // Drag handler for layers
  const handleLayerDrag = (e: React.DragEvent, layerId: string) => {
      const containerRect = canvasContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      // Draggable sets x/y to 0 on drop, so we only update if it's not 0
      if (e.clientX !== 0 || e.clientY !== 0) {
        updateLayer(layerId, { x, y });
      }
  };


  const handleSaveDraft = () => {
    if (!bgMedia || !template) return;
    const designData: SavedDesignData = { bgMedia, layers };
    saveDesign({ id: existingDraft?.id, template_id: template.id, ratio: activeRatio, layers_json: designData });
    alert('Draft Saved!');
  };

  const handleDownload = async () => {
    if (!bgMedia || !template || !canvasContainerRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
        const designData: SavedDesignData = { bgMedia, layers };
        const displaySize = { 
            width: canvasContainerRef.current.offsetWidth,
            height: canvasContainerRef.current.offsetHeight
        };
        const canvasSize = { 
            width: displaySize.width * 2, // Export at 2x resolution
            height: displaySize.height * 2
        };

        const blob = await exportMedia(designData, template.png_url, appSettings, canvasSize, displaySize);
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

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'My Timepass Katta Creation',
                text: 'make your creative now visit: www.timepasskatta.app',
            });
            onSuccessfulExport();
        } else {
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
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-30">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
        </button>
        <h1 className="font-bold text-[#2C3E50] text-lg">{template.title}</h1>
        <div className="flex items-center gap-2">
            <button onClick={resetTransform} className="p-2 rounded-full hover:bg-gray-100"><ResetIcon className="w-6 h-6 text-[#2C3E50]" /></button>
        </div>
      </header>
      
       <div className="w-full bg-white shadow-sm p-2 flex justify-center gap-2">
            <button onClick={addTextLayer} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Add Text</button>
            <button onClick={() => setIsStickerModalOpen(true)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Add Sticker</button>
        </div>

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
          onClick={() => setSelectedLayerId(null)}
        >
          {bgMedia ? (
            <>
              {/* Background Media */}
              <div 
                className="absolute top-0 left-0 origin-top-left"
                style={{ transform: `translate(${bgMedia.x}px, ${bgMedia.y}px) scale(${bgMedia.scale})`, cursor: interactionState.isDragging ? 'grabbing' : 'grab' }}
              >
                {bgMedia.type === 'image' ? (
                  <img ref={mediaRef as React.RefObject<HTMLImageElement>} src={bgMedia.src} alt="User upload" className="pointer-events-none max-w-none" />
                ) : (
                  <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={bgMedia.src} autoPlay muted loop playsInline className="pointer-events-none max-w-none" />
                )}
              </div>

              {/* Dynamic Layers */}
              {layers.map(layer => (
                <div
                    key={layer.id}
                    draggable
                    onDragEnd={(e) => handleLayerDrag(e, layer.id)}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedLayerId(layer.id);
                      bringLayerToFront(layer.id);
                    }}
                    className={`absolute z-20 cursor-move border-2 ${selectedLayerId === layer.id ? 'border-dashed border-blue-500' : 'border-transparent'}`}
                    style={{ 
                        transform: `translate(${layer.x}px, ${layer.y}px) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                        transformOrigin: 'center center',
                        // zIndex is handled by array order
                    }}
                >
                    {layer.type === 'text' && (
                        <div style={{ fontFamily: layer.fontFamily, fontSize: layer.fontSize, color: layer.color, whiteSpace: 'nowrap' }}>
                            {layer.text}
                        </div>
                    )}
                    {layer.type === 'sticker' && (
                        <img src={layer.src} alt="sticker" style={{ width: layer.width, height: layer.height }} className="pointer-events-none" />
                    )}
                </div>
              ))}

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
        
        {/* Layer Editing Panel */}
        {selectedLayer && (
            <div className="w-full max-w-md mt-4 bg-white p-4 rounded-[20px] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[#2C3E50]">Edit Layer</h3>
                    <button onClick={() => deleteLayer(selectedLayer.id)} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                </div>
                {selectedLayer.type === 'text' && (
                    <>
                        <input type="text" value={selectedLayer.text} onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })} className="w-full p-2 border rounded-lg" />
                        <div className="grid grid-cols-3 gap-2">
                            <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} className="w-full h-10 p-1 border rounded-lg" />
                            <input type="number" value={selectedLayer.fontSize} onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} className="w-full p-2 border rounded-lg" />
                            <select value={selectedLayer.fontFamily} onChange={e => updateLayer(selectedLayer.id, { fontFamily: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                                {FONT_FACES.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                            </select>
                        </div>
                    </>
                )}
                {selectedLayer.type === 'sticker' && <p className="text-sm text-gray-500 text-center">Move or delete the sticker.</p>}
            </div>
        )}
        
        <div className="w-full max-w-md mt-4">
            <div className="flex justify-center gap-2 mb-4">
                {template.ratios_supported.map(ratio => (
                    <button key={ratio} onClick={() => setActiveRatio(ratio)} className={`px-3 py-1 text-sm rounded-full ${activeRatio === ratio ? 'bg-[#2C3E50] text-white' : 'bg-white text-[#2C3E50]'}`}>{ratio}</button>
                ))}
            </div>

            <div className="flex gap-2">
                <button onClick={handleSaveDraft} disabled={!bgMedia} className="w-full text-center p-3 rounded-[20px] bg-white text-[#2C3E50] font-bold disabled:opacity-50 shadow-sm">Save Draft</button>
                <button onClick={handleDownload} disabled={!bgMedia || isDownloading} className="w-full text-center p-3 rounded-[20px] bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2C11] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {isDownloading ? 'Processing...' : (<> <DownloadIcon className="w-6 h-6" /> <span>Download</span> </>)}
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
    {isStickerModalOpen && <StickerModal onClose={() => setIsStickerModalOpen(false)} onSelect={addStickerLayer} />}
    </>
  );
};

export default EditorScreen;