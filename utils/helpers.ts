import { AspectRatio, SavedDesignData, AppSettings } from '../types';

// Helper to rewrite Firebase Storage URLs to use the Netlify proxy
const rewriteFirebaseUrl = (url: string): string => {
    if (!url) return '';
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
    // Translate to the center of where the media should be
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(media, 0, 0);
    ctx.restore();
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    // No proxy for local blob URLs or data URLs
    const finalSrc = src.startsWith('blob:') || src.startsWith('data:') ? src : rewriteFirebaseUrl(src);
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Required for fetching from Firebase Storage URL even with proxy
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${src}. This may be a CORS issue.`));
        img.src = finalSrc;
    });
};

const loadVideoFrame = (src: string): Promise<HTMLVideoElement> => {
    // No proxy for local blob URLs
    const finalSrc = src.startsWith('blob:') ? src : rewriteFirebaseUrl(src);
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = "anonymous";
        video.onloadeddata = () => {
            video.currentTime = 0;
        };
        video.onseeked = () => resolve(video);
        video.onerror = (e) => reject(new Error(`Failed to load video: ${src}`));
        video.src = finalSrc;
        video.load(); // Required for some browsers
    });
}

const drawWatermark = (ctx: CanvasRenderingContext2D, text: string) => {
    ctx.save();
    const padding = 20;
    ctx.font = 'bold 16px Poppins, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const textMetrics = ctx.measureText(text);
    const x = ctx.canvas.width - textMetrics.width - padding;
    const y = ctx.canvas.height - padding;
    ctx.fillText(text, x, y);
    ctx.restore();
};


export const exportMedia = async (
    designData: SavedDesignData,
    templateImageSrc: string,
    appSettings: AppSettings,
    canvasSize: { width: number; height: number; },
    displaySize: { width: number; height: number; }
): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    // Load template image
    const templateImage = await loadImage(templateImageSrc);
    
    // Load background media
    let mediaElement: HTMLImageElement | HTMLVideoElement;
    if (designData.bgMedia.type === 'image') {
        mediaElement = await loadImage(designData.bgMedia.src);
    } else {
        mediaElement = await loadVideoFrame(designData.bgMedia.src);
    }

    // Calculate scaling factor
    const scaleFactor = canvas.width / displaySize.width;

    // --- Start Drawing ---

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background Media
    const exportBgTransform = {
        ...designData.bgMedia,
        x: designData.bgMedia.x * scaleFactor,
        y: designData.bgMedia.y * scaleFactor,
        scale: designData.bgMedia.scale * scaleFactor
    };
    drawTransformedMedia(ctx, mediaElement, exportBgTransform);

    // 2. Draw Template Overlay
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    
    // 3. Draw Watermark if enabled
    if (appSettings.watermarkEnabled && appSettings.watermarkText) {
        drawWatermark(ctx, appSettings.watermarkText);
    }
        
    return await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob from canvas.'));
            }
        }, 'image/png');
    });
};

export const getAspectRatioDecimal = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};