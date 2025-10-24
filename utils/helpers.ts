import { AspectRatio } from '../types';

// Helper to rewrite Firebase Storage URLs to use the Netlify proxy
const rewriteFirebaseUrl = (url: string): string => {
    const firebaseBaseUrl = 'https://firebasestorage.googleapis.com';
    if (url.startsWith(firebaseBaseUrl)) {
        // Example: https://firebasestorage.googleapis.com/v0/b/....
        // Becomes: /api/images/v0/b/....
        return `/api/images${url.substring(firebaseBaseUrl.length)}`;
    }
    // Don't rewrite local blob URLs (from user uploads) or data URLs
    return url;
};


// A helper to draw image with transformations
const drawTransformedImage = (ctx: CanvasRenderingContext2D, image: HTMLImageElement | HTMLVideoElement, transform: { x: number; y: number; scale: number; }) => {
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(image, 0, 0);
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

export const exportMedia = async (
    userMedia: { src: string, type: 'image' | 'video' },
    templateImageSrc: string,
    transform: { x: number; y: number; scale: number; },
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

    try {
        const templateImage = await loadImage(templateImageSrc);
        let mediaElement: HTMLImageElement | HTMLVideoElement;

        if (userMedia.type === 'image') {
            mediaElement = await loadImage(userMedia.src);
        } else {
            mediaElement = await loadVideoFrame(userMedia.src);
        }

        // Calculate the scaling factor between the on-screen display and the export canvas
        const scaleX = canvas.width / displaySize.width;
        const scaleY = canvas.height / displaySize.height;
        
        // As we maintain aspect ratio, scaleX and scaleY should be the same. We can use one.
        const exportTransform = {
            x: transform.x * scaleX,
            y: transform.y * scaleY,
            scale: transform.scale * scaleX
        };
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTransformedImage(ctx, mediaElement, exportTransform);
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
        
        return await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob from canvas.'));
                }
            }, 'image/png');
        });

    } catch (error) {
        console.error("Error during media export:", error);
        throw error; // Re-throw the error to be caught by the caller
    }
};

export const getAspectRatioDecimal = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};