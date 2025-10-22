import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ASPECT_RATIOS, LANGUAGES } from '../../constants';
import { CategoryName, AspectRatio, Role } from '../../types';

const MAX_FILE_SIZE = 300 * 1024; // 300 KB

const UserCreateTemplateScreen: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, submitTemplate, adminSubmitTemplate, categories } = useData();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<CategoryName>(categories[0]?.name || '');
    const [language, setLanguage] = useState<string>(LANGUAGES[0]);
    const [tags, setTags] = useState('');
    const [ratios, setRatios] = useState<AspectRatio[]>(['4:5']);
    const [pngFile, setPngFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [pngPreview, setPngPreview] = useState<string | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        if (categories.length > 0 && !category) {
            setCategory(categories[0].name);
        }
    }, [categories, category]);

    useEffect(() => {
        if (pngPreview && bgPreview && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bgImage = new Image();
            bgImage.src = bgPreview;
            bgImage.onload = () => {
                const pngImage = new Image();
                pngImage.src = pngPreview;
                pngImage.onload = () => {
                    const previewWidth = 400;
                    canvas.width = previewWidth;
                    canvas.height = previewWidth * 1.25;
                    ctx.clearRect(0,0, canvas.width, canvas.height);
                    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
                    ctx.drawImage(pngImage, 0, 0, canvas.width, canvas.height);
                };
            };
        }
    }, [pngPreview, bgPreview]);

    const handleRatioChange = (ratio: AspectRatio) => {
        setRatios(prev => 
            prev.includes(ratio) ? prev.filter(r => r !== ratio) : [...prev, ratio]
        );
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string|null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setError(`File size cannot exceed ${MAX_FILE_SIZE / 1024} KB.`);
                return;
            }
            setError('');
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pngFile || !bgFile || ratios.length === 0 || !title.trim() || !tags.trim()) {
            setError('Please fill all fields and upload both images.');
            return;
        }
        setError('');
        setLoading(true);

        const submissionData = {
            title,
            category,
            language,
            tags: tags.split(',').map(t => t.trim()),
            ratios_supported: ratios,
            ratio_default: ratios[0] || '4:5',
        };
        
        try {
            if(currentUser?.role === Role.ADMIN) {
                await adminSubmitTemplate(submissionData, { pngFile, bgFile });
                alert('Template published successfully!');
                navigate('/templates');
            } else {
                await submitTemplate(submissionData, { pngFile, bgFile });
                alert('Template submitted for review. Thank you!');
                navigate('/');
            }
        } catch(err) {
            console.error(err);
            setError('Failed to submit template. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const isAdmin = currentUser?.role === Role.ADMIN;

    return (
        <div className="p-4">
            <div className="bg-white p-6 rounded-[30px] shadow-sm max-w-2xl mx-auto">
                <h1 className="text-xl font-bold text-center text-[#2C3E50] mb-4">Add New Template</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="font-semibold text-[#2C3E50]">1. Upload PNG Overlay (.png only)</label>
                            <input type="file" onChange={(e) => handleFileChange(e, setPngFile, setPngPreview)} accept="image/png" required className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7A00] hover:file:bg-orange-100"/>
                            {pngFile && <div className="text-xs text-gray-500 mt-1 truncate">Selected: {pngFile.name}</div>}
                            {pngPreview && <img src={pngPreview} alt="png preview" className="w-16 h-16 object-contain border rounded-md mt-2" />}
                        </div>
                        <div>
                            <label className="font-semibold text-[#2C3E50]">2. Upload Preview Background</label>
                            <input type="file" onChange={(e) => handleFileChange(e, setBgFile, setBgPreview)} accept="image/jpeg,image/png" required className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7A00] hover:file:bg-orange-100"/>
                            {bgFile && <div className="text-xs text-gray-500 mt-1 truncate">Selected: {bgFile.name}</div>}
                            {bgPreview && <img src={bgPreview} alt="bg preview" className="w-16 h-16 object-cover border rounded-md mt-2" />}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-[#2C3E50] mb-2">3. Live Composite Preview</h3>
                        <div className="bg-gray-100 rounded-lg p-2 flex justify-center">
                            <canvas ref={canvasRef} className="rounded-md shadow-inner w-full max-w-[250px] aspect-[4/5]"></canvas>
                        </div>
                    </div>

                    <hr/>

                    <div>
                        <label className="font-semibold text-[#2C3E50]">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg" />
                    </div>
                     <div>
                        <label className="font-semibold text-[#2C3E50]">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as CategoryName)} className="w-full mt-1 p-2 border rounded-lg bg-white">
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
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : (isAdmin ? 'Publish Template' : 'Submit for Review')}
                    </button>
                    {isAdmin && <button type="button" onClick={() => navigate(-1)} className="w-full mt-2 text-center py-2 text-gray-600">Cancel</button>}
                </form>
            </div>
        </div>
    );
};

export default UserCreateTemplateScreen;