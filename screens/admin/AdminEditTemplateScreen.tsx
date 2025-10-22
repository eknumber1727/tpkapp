import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ASPECT_RATIOS, LANGUAGES } from '../../constants';
import { CategoryName, AspectRatio, Template } from '../../types';
import { ChevronLeftIcon } from '../../components/shared/Icons';

const AdminEditTemplateScreen: React.FC = () => {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const { getTemplateById, updateTemplate, categories } = useData();

    const [template, setTemplate] = useState<Template | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<CategoryName>('');
    const [language, setLanguage] = useState<string>(LANGUAGES[0]);
    const [tags, setTags] = useState('');
    const [ratios, setRatios] = useState<AspectRatio[]>(['4:5']);
    const [isActive, setIsActive] = useState(true);
    
    const [pngFile, setPngFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [pngPreview, setPngPreview] = useState<string | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    useEffect(() => {
        if (templateId) {
            const foundTemplate = getTemplateById(templateId);
            if (foundTemplate) {
                setTemplate(foundTemplate);
                setTitle(foundTemplate.title);
                setCategory(foundTemplate.category);
                setLanguage(foundTemplate.language);
                setTags(foundTemplate.tags.join(', '));
                setRatios(foundTemplate.ratios_supported);
                setIsActive(foundTemplate.is_active);
                setPngPreview(foundTemplate.png_url);
                setBgPreview(foundTemplate.bg_preview_url);
            }
        }
    }, [templateId, getTemplateById]);

    useEffect(() => {
        const currentPng = pngPreview;
        const currentBg = bgPreview;
        if (currentPng && currentBg && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';
            bgImage.src = currentBg;
            bgImage.onload = () => {
                const pngImage = new Image();
                pngImage.crossOrigin = 'anonymous';
                pngImage.src = currentPng;
                pngImage.onload = () => {
                    const previewWidth = 400;
                    canvas.width = previewWidth;
                    canvas.height = previewWidth * 1.25; // Default to 4:5 aspect ratio
                    ctx.clearRect(0,0, canvas.width, canvas.height);
                    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
                    ctx.drawImage(pngImage, 0, 0, canvas.width, canvas.height);
                };
                 pngImage.onerror = () => console.error("Failed to load PNG preview for canvas");
            };
            bgImage.onerror = () => console.error("Failed to load BG preview for canvas");
        }
    }, [pngPreview, bgPreview]);
    

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string|null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError('');
            setFile(file);
            const newPreviewUrl = URL.createObjectURL(file);
            
            // Clean up old blob URL
            setPreview(prev => {
                if (prev && prev.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return newPreviewUrl;
            });
        }
    };
    
    const handleRatioChange = (ratio: AspectRatio) => {
        setRatios(prev => 
            prev.includes(ratio) ? prev.filter(r => r !== ratio) : [...prev, ratio]
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateId || ratios.length === 0 || !title.trim() || !tags.trim()) {
            setError('Please fill all required fields.');
            return;
        }
        
        setLoading(true);
        setError('');

        const updatedData = {
            title,
            category,
            language,
            tags: tags.split(',').map(t => t.trim()),
            ratios_supported: ratios,
            ratio_default: ratios[0] || '4:5',
            is_active: isActive,
        };

        const newFiles: { pngFile?: File, bgFile?: File, compositeFile?: Blob } = {};
        if(pngFile) newFiles.pngFile = pngFile;
        if(bgFile) newFiles.bgFile = bgFile;

        // Generate new composite ONLY if images were changed
        if ((pngFile || bgFile) && canvasRef.current) {
            canvasRef.current.toBlob(async (blob) => {
                if (!blob) {
                    setError('Could not generate new preview image.');
                    setLoading(false);
                    return;
                }
                newFiles.compositeFile = blob;
                try {
                    await updateTemplate(templateId, updatedData, newFiles);
                    alert('Template updated successfully!');
                    navigate('/templates');
                } catch (err) {
                    console.error(err);
                    setError('Failed to update template. Please try again.');
                } finally {
                    setLoading(false);
                }
            }, 'image/jpeg', 0.9);
        } else {
            // No new images, just update data
            try {
                await updateTemplate(templateId, updatedData, newFiles);
                alert('Template updated successfully!');
                navigate('/templates');
            } catch (err) {
                console.error(err);
                setError('Failed to update template. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    if (!template) {
        return <div className="p-4">Loading template...</div>;
    }

    return (
        <div>
            <div className="flex items-center mb-6">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
                    <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
                </button>
                <h1 className="text-2xl font-bold text-[#2C3E50] ml-2">Edit Template</h1>
            </div>
            <div className="bg-white p-6 rounded-[30px] shadow-sm max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="font-semibold text-[#2C3E50]">1. Replace PNG Overlay (.png only)</label>
                            <input type="file" onChange={(e) => handleFileChange(e, setPngFile, setPngPreview)} accept="image/png" className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7A00] hover:file:bg-orange-100"/>
                            {pngPreview && <img src={pngPreview} alt="png preview" className="w-16 h-16 object-contain border rounded-md mt-2" />}
                        </div>
                        <div>
                            <label className="font-semibold text-[#2C3E50]">2. Replace Preview Background</label>
                            <input type="file" onChange={(e) => handleFileChange(e, setBgFile, setBgPreview)} accept="image/jpeg,image/png" className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7A00] hover:file:bg-orange-100"/>
                            {bgPreview && <img src={bgPreview} alt="bg preview" className="w-16 h-16 object-cover border rounded-md mt-2" />}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-[#2C3E50] mb-2">3. Live Composite Preview</h3>
                        <div className="bg-gray-100 rounded-lg p-2 flex justify-center">
                            <canvas ref={canvasRef} className="rounded-md shadow-inner w-full max-w-[250px] aspect-[4/5]"></canvas>
                        </div>
                    </div>
                    
                    <hr />

                    <div>
                        <label className="font-semibold text-[#2C3E50]">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg" />
                    </div>
                     <div>
                        <label className="font-semibold text-[#2C3E50]">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white">
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold text-[#2C3E50]">Language</label>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white">
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold text-[#2C3E50]">Tags (comma separated)</label>
                        <input type="text" value={tags} onChange={e => setTags(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="font-semibold text-[#2C3E50]">Supported Ratios</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {ASPECT_RATIOS.map(ratio => (
                                <button type="button" key={ratio} onClick={() => handleRatioChange(ratio)} className={`p-2 rounded-lg text-sm ${ratios.includes(ratio) ? 'bg-[#2C3E50] text-white' : 'bg-gray-100'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                            <span className="font-semibold text-[#2C3E50]">Is Active</span>
                        </label>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminEditTemplateScreen;