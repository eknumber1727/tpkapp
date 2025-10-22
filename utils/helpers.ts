// FIX: Imported the 'AspectRatio' type from '../types' to resolve the TypeScript error.
import { AspectRatio } from '../types';

// A helper to draw image with transformations
const drawTransformedImage = (ctx: CanvasRenderingContext2D, image: HTMLImageElement | HTMLVideoElement, transform: { x: number; y: number; scale: number; }) => {
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
};

export const exportMedia = (
    userMedia: { src: string, type: 'image' | 'video' },
    templateImageSrc: string,
    transform: { x: number; y: number; scale: number; },
    canvasSize: { width: number; height: number; },
    onExportReady: (dataUrl: string) => void
) => {
    const templateImage = new Image();
    templateImage.crossOrigin = 'anonymous';
    templateImage.src = templateImageSrc;

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    templateImage.onload = () => {
        if (userMedia.type === 'image') {
            const userImage = new Image();
            userImage.crossOrigin = 'anonymous';
            userImage.src = userMedia.src;
            userImage.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawTransformedImage(ctx, userImage, transform);
                ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
                onExportReady(canvas.toDataURL('image/png'));
            };
        } else { // Video
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = userMedia.src;
            video.addEventListener('loadeddata', () => {
                video.currentTime = 0; // Go to first frame
            });
            video.addEventListener('seeked', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawTransformedImage(ctx, video, transform);
                ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
                onExportReady(canvas.toDataURL('image/png'));
                alert("Video overlay export is not supported on this device. The first frame has been exported as an image.");
            });
        }
    };
};

export const getAspectRatioDecimal = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};
