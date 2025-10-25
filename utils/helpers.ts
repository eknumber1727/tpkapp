import { AspectRatio, SavedDesignData, AppSettings } from '../types';

// FFMPEG is loaded via script tag in index.html
declare var FFmpeg: any;
let ffmpeg: any;

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
    onProgress?: (message: string) => void
): Promise<{blob: Blob, fileType: 'image' | 'video'}> => {

    const { bgMedia } = designData;

    // --- CASE 1: BACKGROUND IS AN IMAGE ---
    if (bgMedia.type === 'image') {
        onProgress?.('Generating image...');
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
        onProgress?.('Initializing video processor...');
        if (!ffmpeg) {
            ffmpeg = FFmpeg.createFFmpeg({ 
                log: true,
                progress: (p: any) => onProgress?.(`Processing video... ${Math.round(p.ratio * 100)}%`)
            });
            await ffmpeg.load();
        }

        onProgress?.('Downloading video files...');
        const [videoData, overlayData] = await Promise.all([
            fetchUrlAsUint8Array(bgMedia.src),
            fetchUrlAsUint8Array(templateImageSrc),
        ]);
        
        ffmpeg.FS('writeFile', 'input.mp4', videoData);
        ffmpeg.FS('writeFile', 'overlay.png', overlayData);
        
        const scaleFactor = canvasSize.width / displaySize.width;
        const x = bgMedia.x * scaleFactor;
        const y = bgMedia.y * scaleFactor;
        const scale = bgMedia.scale * scaleFactor;
        
        const videoInfo = await ffprobe(ffmpeg, 'input.mp4');
        const videoStream = videoInfo.streams.find((s: any) => s.codec_type === 'video');
        if (!videoStream) throw new Error("Could not find video stream in file.");

        const originalWidth = videoStream.width;
        const originalHeight = videoStream.height;
        
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        const cropWidth = canvasSize.width;
        const cropHeight = canvasSize.height;

        // The position (x, y) is the top-left of the scaled video relative to the canvas.
        // The crop filter's x,y is the top-left corner of the crop rectangle relative to the *input video*.
        // So we need to calculate the crop start point based on the pan.
        const cropX = -x;
        const cropY = -y;
        
        const vfComplex = `[0:v]scale=${scaledWidth}:${scaledHeight} [scaled]; [scaled]crop=${cropWidth}:${cropHeight}:${cropX}:${cropY} [cropped]; [cropped][1:v]overlay=0:0`;
        
        const args = ['-i', 'input.mp4', '-i', 'overlay.png', '-filter_complex', vfComplex];
        
        // Add watermark if enabled
        if (appSettings.watermarkEnabled && appSettings.watermarkText) {
            onProgress?.('Adding watermark...');
            const watermarkData = await createWatermarkOverlay(appSettings.watermarkText, canvasSize.width, canvasSize.height);
            ffmpeg.FS('writeFile', 'watermark.png', watermarkData);
            args.push('-i', 'watermark.png', '-filter_complex', '[0][1]overlay[bg];[bg][2]overlay');
            // This is a simplified filter chain. A correct one is more complex. Let's adjust.
            // Correct complex filter chain for 3 inputs (video, overlay, watermark)
            const finalVfComplex = `[0:v]scale=${scaledWidth}:${scaledHeight} [scaled]; [scaled]crop=${cropWidth}:${cropHeight}:${cropX}:${cropY} [cropped]; [cropped][1:v]overlay=0:0 [with_overlay]; [with_overlay][2:v]overlay=0:0`;
            args[3] = finalVfComplex; // Replace the old filter_complex
        }

        // Handle audio
        if (bgMedia.muted === false) {
             // If there's an audio stream, copy it
            if (videoInfo.streams.some((s: any) => s.codec_type === 'audio')) {
                args.push('-c:a', 'copy');
            }
        } else {
            args.push('-an'); // No audio
        }
        
        args.push('output.mp4');

        onProgress?.('Rendering video...');
        await ffmpeg.run(...args);
        
        onProgress?.('Finalizing...');
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });

        return { blob, fileType: 'video' };
    }
    
    throw new Error('Unsupported background media type');
};

// Helper function to get video metadata using ffmpeg
const ffprobe = async (ffmpegInstance: any, filePath: string) => {
    let info: any = {};
    // Hacky way to capture ffprobe output since it logs to stderr
    const originalLog = ffmpegInstance.getLog;
    let output = '';
    ffmpegInstance.setLogger(({ message }: { message: string }) => {
        output += message + '\n';
    });
    
    try {
        await ffmpegInstance.run('-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-i', filePath);
    } catch (e) {
        // ffprobe exits with non-zero code, which is expected. The output is still captured.
    } finally {
        ffmpegInstance.setLogger(originalLog);
    }
    
    try {
        // Find the JSON part of the output
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = output.substring(jsonStart, jsonEnd);
            info = JSON.parse(jsonString);
        } else {
            throw new Error("Could not parse ffprobe output.");
        }
    } catch(e) {
        console.error("FFProbe output parsing failed:", output);
        throw e;
    }
    return info;
};


export const getAspectRatioDecimal = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};