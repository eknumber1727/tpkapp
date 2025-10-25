import { AspectRatio, SavedDesignData, AppSettings } from '../types';

// FFMPEG is loaded via script tag in index.html
declare var FFmpeg: any;
let ffmpeg: any;
let ffmpegLoadPromise: Promise<void> | null = null;

// Singleton loader to ensure FFMPEG is loaded only once and is ready.
const loadFFmpeg = async (onProgress: (message: string) => void): Promise<any> => {
    if (ffmpeg && ffmpeg.isLoaded()) {
        return ffmpeg;
    }
    if (ffmpegLoadPromise) {
        await ffmpegLoadPromise;
        return ffmpeg;
    }

    onProgress('Initializing video processor...');

    ffmpegLoadPromise = new Promise(async (resolve, reject) => {
        try {
            ffmpeg = FFmpeg.createFFmpeg({
                log: true,
                progress: (p: any) => {
                    if (p.ratio) {
                        onProgress(`Processing video... ${Math.round(p.ratio * 100)}%`);
                    }
                }
            });
            await ffmpeg.load();
            resolve();
        } catch (e) {
            ffmpegLoadPromise = null; // Reset on failure to allow retry
            reject(e);
        }
    });

    await ffmpegLoadPromise;
    return ffmpeg;
};


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

const fetchUrlAsUint8Array = async (url: string) => {
    const finalUrl = url.startsWith('blob:') ? url : rewriteFirebaseUrl(url);
    const response = await fetch(finalUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};


const drawWatermark = (ctx: CanvasRenderingContext2D, text: string) => {
    ctx.save();
    const padding = Math.min(ctx.canvas.width * 0.03, 20); // Responsive padding
    const fontSize = Math.max(ctx.canvas.width * 0.02, 16); // Responsive font size
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    const x = ctx.canvas.width - padding;
    const y = ctx.canvas.height - padding;
    ctx.fillText(text, x, y);
    ctx.restore();
};

const createWatermarkOverlay = async (text: string, width: number, height: number): Promise<Uint8Array> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas for watermark");
    
    // Draw watermark text on a transparent canvas
    drawWatermark(ctx, text);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error("Could not create blob for watermark");
    
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

export const exportMedia = async (
    designData: SavedDesignData,
    templateImageSrc: string,
    appSettings: AppSettings,
    canvasSize: { width: number; height: number; },
    displaySize: { width: number; height: number; },
    onProgress: (message: string) => void
): Promise<{blob: Blob, fileType: 'image' | 'video'}> => {

    const { bgMedia } = designData;

    // --- CASE 1: BACKGROUND IS AN IMAGE ---
    if (bgMedia.type === 'image') {
        onProgress('Generating image...');
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        const [templateImage, mediaElement] = await Promise.all([
            loadImage(templateImageSrc),
            loadImage(bgMedia.src)
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
        
        if (appSettings.watermarkEnabled && appSettings.watermarkText) {
            drawWatermark(ctx, appSettings.watermarkText);
        }
            
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob from canvas.')), 'image/jpeg', 0.9);
        });
        return { blob, fileType: 'image' };
    }

    // --- CASE 2: BACKGROUND IS A VIDEO ---
    else if (bgMedia.type === 'video') {
        const ffmpegInstance = await loadFFmpeg(onProgress);
        
        onProgress('Downloading video files...');
        const [videoData, overlayData] = await Promise.all([
            fetchUrlAsUint8Array(bgMedia.src),
            fetchUrlAsUint8Array(templateImageSrc),
        ]);
        
        ffmpegInstance.FS('writeFile', 'input.mp4', videoData);
        ffmpegInstance.FS('writeFile', 'overlay.png', overlayData);
        
        const scaleFactor = canvasSize.width / displaySize.width;
        const x = bgMedia.x * scaleFactor;
        const y = bgMedia.y * scaleFactor;
        const scale = bgMedia.scale * scaleFactor;
        
        const videoInfo = await ffprobe(ffmpegInstance, 'input.mp4');
        const videoStream = videoInfo.streams.find((s: any) => s.codec_type === 'video');
        if (!videoStream) throw new Error("Could not find video stream in file.");

        const originalWidth = videoStream.width;
        const originalHeight = videoStream.height;
        
        const scaledWidth = Math.round(originalWidth * scale);
        const scaledHeight = Math.round(originalHeight * scale);

        const cropWidth = Math.round(canvasSize.width);
        const cropHeight = Math.round(canvasSize.height);

        const cropX = Math.round(-x);
        const cropY = Math.round(-y);
        
        let vfComplex = `[0:v]scale=${scaledWidth}:${scaledHeight} [scaled]; [scaled]crop=${cropWidth}:${cropHeight}:${cropX}:${cropY} [cropped]; [cropped][1:v]overlay=0:0`;
        
        const args = ['-i', 'input.mp4', '-i', 'overlay.png'];
        
        // Add watermark if enabled
        if (appSettings.watermarkEnabled && appSettings.watermarkText) {
            const watermarkData = await createWatermarkOverlay(appSettings.watermarkText, canvasSize.width, canvasSize.height);
            ffmpegInstance.FS('writeFile', 'watermark.png', watermarkData);
            args.push('-i', 'watermark.png');
            vfComplex = `[0:v]scale=${scaledWidth}:${scaledHeight}[scaled];[scaled]crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}[cropped];[cropped][1:v]overlay=0:0[with_overlay];[with_overlay][2:v]overlay=0:0`;
        }

        args.push('-filter_complex', vfComplex);

        // Handle audio
        if (bgMedia.muted === false) {
            if (videoInfo.streams.some((s: any) => s.codec_type === 'audio')) {
                args.push('-c:a', 'copy');
            }
        } else {
            args.push('-an'); // No audio
        }
        
        args.push('output.mp4');

        await ffmpegInstance.run(...args);
        
        onProgress('Finalizing...');
        const data = ffmpegInstance.FS('readFile', 'output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });

        return { blob, fileType: 'video' };
    }
    
    throw new Error('Unsupported background media type');
};

// Helper function to get video metadata using ffmpeg
const ffprobe = async (ffmpegInstance: any, filePath: string) => {
    let info: any = {};
    const output: string[] = [];
    ffmpegInstance.setLogger(({ message }: { message: string }) => {
        output.push(message);
    });
    
    try {
        await ffmpegInstance.run('-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-i', filePath);
    } catch (e) {
        // ffprobe can exit with a non-zero code which is fine, as long as we get the output.
    } finally {
        ffmpegInstance.setLogger(() => {}); // Clear logger
    }
    
    const fullOutput = output.join('\n');
    try {
        const jsonStart = fullOutput.indexOf('{');
        const jsonEnd = fullOutput.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = fullOutput.substring(jsonStart, jsonEnd);
            info = JSON.parse(jsonString);
        } else {
            throw new Error("Could not parse ffprobe output.");
        }
    } catch(e) {
        console.error("FFProbe output parsing failed:", fullOutput);
        throw e;
    }
    return info;
};


export const getAspectRatioDecimal = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};