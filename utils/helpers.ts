import { AspectRatio, SavedDesignData, AppSettings } from '../types';

// Helper to rewrite Firebase Storage URLs to use the Netlify proxy
// This is critical for avoiding CORS issues when drawing images to a canvas from a different origin.
const rewriteFirebaseUrl = (url: string): string => {
    if (!url) return '';
    
    // Check if running on localhost, if so, no need for proxy
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return url;
    }

    const firebaseBaseUrl = 'https://firebasestorage.googleapis.com';
    if (url.startsWith(firebaseBaseUrl)) {
        // Example: https://firebasestorage.googleapis.com/v0/b/....
        // Becomes: /api/images/v0/b/....
        return `/api/images${url.substring(firebaseBaseUrl.length)}`;
    }
    // Don't rewrite local blob URLs (from user uploads) or data URLs
    return url;
};


const drawTransformedMedia = (ctx: CanvasRenderingContext2D, media: HTMLImageElement | HTMLVideoElement, transform: SavedDesignData['bgMedia']) => {
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(media, 0, 0);
    ctx.restore();
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    const finalSrc = src.startsWith('blob:') || src.startsWith('data:') ? src : rewriteFirebaseUrl(src);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}. This may be a CORS issue. Make sure the Netlify proxy is configured.`));
        img.src = finalSrc;
    });
};


export const exportMedia = async (
    designData: SavedDesignData,
    templateImageSrc: string,
    canvasSize: { width: number; height: number; },
    displaySize: { width: number; height: number; },
    onProgress: (message: string) => void
): Promise<{blob: Blob, fileType: 'image' | 'video'}> => {

    const { bgMedia } = designData;
    onProgress('Generating image...');

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const [templateImage, mediaElement] = await Promise.all([
        loadImage(templateImageSrc),
        // For video, we load it as an image to capture the current frame
        bgMedia.type === 'video' ? captureVideoFrame(bgMedia.src) : loadImage(bgMedia.src)
    ]);
    
    const scaleFactor = canvas.width / displaySize.width;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const exportBgTransform = {
        ...bgMedia,
        x: bgMedia.x * scaleFactor,
        y: bgMedia.y * scaleFactor,
        scale: bgMedia.scale * scaleFactor
    };

    drawTransformedMedia(ctx, mediaElement, exportBgTransform);
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob from canvas.')), 'image/jpeg', 0.9);
    });
    
    // Always return as image for simplicity, as per user request to remove video export
    return { blob, fileType: 'image' };
};

// Helper function to capture a single frame from a video URL and return it as an HTMLImageElement
const captureVideoFrame = (videoSrc: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = "anonymous";
        const finalSrc = videoSrc.startsWith('blob:') ? videoSrc : rewriteFirebaseUrl(videoSrc);

        video.onloadeddata = () => {
            // Seek to the first frame
            video.currentTime = 0;
        };
        video.onseeked = () => {
             const canvas = document.createElement('canvas');
             canvas.width = video.videoWidth;
             canvas.height = video.videoHeight;
             const ctx = canvas.getContext('2d');
             if (!ctx) return reject(new Error("Could not get canvas context for video frame"));
             ctx.drawImage(video, 0, 0);

             const img = new Image();
             img.onload = () => resolve(img);
             img.onerror = reject;
             img.src = canvas.toDataURL();
             // Clean up
             URL.revokeObjectURL(video.src);
        };
        video.onerror = (e) => reject(new Error(`Failed to load video for frame capture: ${e}`));
        
        video.src = finalSrc;
    });
};


export const getAspectRatioDecimal = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};