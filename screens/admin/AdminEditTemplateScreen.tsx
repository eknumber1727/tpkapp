import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ASPECT_RATIOS, LANGUAGES } from '../../constants';
import { CategoryName, AspectRatio, Template } from '../../types';
import { ChevronLeftIcon } from '../../components/shared/Icons';

const MAX_FILE_SIZE = 300 * 1024; // 300 KB

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
        setError('');
        setLoading(true);

        const updatedData = {
            title,
            category,
            language,
            tags: tags.split(',').map(t => t.trim()),
            ratios_supported: ratios,
            ratio_default: ratios[0] || '4:5',
            is_active: isActive,
        };

        try {
            await updateTemplate(templateId, updatedData, { pngFile: pngFile || undefined, bgFile: bgFile || undefined });
            alert('Template updated successfully!');
            navigate('/templates');
        } catch (err) {
            console.error(err);
            setError('Failed to update template. Please try again.');
        } finally {
            setLoading(false);
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