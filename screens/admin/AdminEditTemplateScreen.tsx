import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ASPECT_RATIOS } from '../../constants';
import { CategoryName, AspectRatio, Template } from '../../types';
import { ChevronLeftIcon } from '../../components/shared/Icons';

const AdminEditTemplateScreen: React.FC = () => {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const { templates, updateTemplate, categories } = useData();

    const [template, setTemplate] = useState<Template | null | undefined>(undefined);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<CategoryName>('');
    const [language, setLanguage] = useState<string>('');
    const [tags, setTags] = useState('');
    const [ratios, setRatios] = useState<AspectRatio[]>(['4:5']);
    const [isActive, setIsActive] = useState(true);
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (templateId) {
            const foundTemplate = templates.find(t => t.id === templateId);
            if (foundTemplate) {
                setTemplate(foundTemplate);
                setTitle(foundTemplate.title);
                setCategory(foundTemplate.category);
                setLanguage(foundTemplate.language);
                setTags(foundTemplate.tags.join(', '));
                setRatios(foundTemplate.ratios_supported);
                setIsActive(foundTemplate.is_active);
            } else if (templates.length > 0) {
                setTemplate(null);
            }
        }
    }, [templateId, templates]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateId || ratios.length === 0 || !title.trim() || !tags.trim()) {
            setError('Please fill all required fields.');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            const updatedData = {
                title,
                category,
                language,
                tags: tags.split(',').map(t => t.trim()),
                ratios_supported: ratios,
                ratio_default: ratios[0] || '4:5',
                is_active: isActive,
            };
            await updateTemplate(templateId, updatedData);
            alert('Template updated successfully!');
            navigate('/templates');
        } catch (err) {
            console.error(err);
            setError('Failed to update template. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (template === undefined) {
        return <div className="p-4 text-center">Loading template...</div>;
    }
    
    if (template === null) {
        return <div className="p-4 text-center">Template not found.</div>;
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="font-semibold text-[#2C3E50]">Uploader</label>
                            <input type="text" value={`@${template.uploader_username}`} readOnly className="w-full mt-1 p-2 border rounded-lg bg-gray-100 text-gray-500" />
                        </div>
                        <div className="flex justify-center items-center">
                             <img src={template.composite_preview_url} alt="Preview" className="w-24 h-30 object-contain rounded-lg bg-gray-100 p-1 border" />
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
                        <input type="text" value={language} onChange={e => setLanguage(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="font-semibold text-[#2C3E50]">Tags (comma separated)</label>
                        <input type="text" value={tags} onChange={e => setTags(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="font-semibold text-[#2C3E50]">Supported Ratios</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {ASPECT_RATIOS.map(ratio => (
                                <button type="button" key={ratio} onClick={() => setRatios(prev => prev.includes(ratio) ? prev.filter(r => r !== ratio) : [...prev, ratio])} className={`p-2 rounded-lg text-sm ${ratios.includes(ratio) ? 'bg-[#2C3E50] text-white' : 'bg-gray-100'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#FF7A00] focus:ring-[#FFB800]" />
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