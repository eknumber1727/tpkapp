import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Template } from '../../types';

const AdminFeaturedManagerScreen: React.FC = () => {
    const { adminTemplates, appSettings, updateAppSettings } = useData();
    const [featuredIds, setFeaturedIds] = useState<string[]>([]);
    const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
    const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const templateMap = useMemo(() => new Map(adminTemplates.map(t => [t.id, t])), [adminTemplates]);

    useEffect(() => {
        const currentFeaturedIds = appSettings.featuredTemplates || [];
        setFeaturedIds(currentFeaturedIds);

        const featured = currentFeaturedIds
            .map(id => templateMap.get(id))
            .filter((t): t is Template => !!t);

        const available = adminTemplates.filter(t => t.is_active && !currentFeaturedIds.includes(t.id));

        setFeaturedTemplates(featured);
        setAvailableTemplates(available);
    }, [appSettings.featuredTemplates, adminTemplates, templateMap]);

    const addToFeatured = (templateId: string) => {
        if (featuredIds.length >= 10) {
            setErrorMessage('You can only feature a maximum of 10 templates.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }
        if (!featuredIds.includes(templateId)) {
            const newFeaturedIds = [...featuredIds, templateId];
            setFeaturedIds(newFeaturedIds);
        }
    };

    const removeFromFeatured = (templateId: string) => {
        const newFeaturedIds = featuredIds.filter(id => id !== templateId);
        setFeaturedIds(newFeaturedIds);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newFeatured = [...featuredIds];
        const item = newFeatured[index];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newFeatured.length) return;
        newFeatured[index] = newFeatured[swapIndex];
        newFeatured[swapIndex] = item;
        setFeaturedIds(newFeatured);
    };

    const handleSave = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await updateAppSettings({ featuredTemplates: featuredIds });
            setSuccessMessage('Featured templates updated successfully!');
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save changes.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };
    
    // This effect updates the display lists immediately when featuredIds changes
    useEffect(() => {
        const featured = featuredIds
            .map(id => templateMap.get(id))
            .filter((t): t is Template => !!t);

        const available = adminTemplates.filter(t => t.is_active && !featuredIds.includes(t.id));
        setFeaturedTemplates(featured);
        setAvailableTemplates(available);
    }, [featuredIds, adminTemplates, templateMap]);


    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#2C3E50]">Featured Manager</h1>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg w-full sm:w-auto disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{successMessage}</p></div>}
            {errorMessage && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{errorMessage}</p></div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Templates */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Available Templates</h2>
                    <div className="space-y-2 flex-grow overflow-y-auto max-h-[60vh]">
                        {availableTemplates.map(template => (
                            <div key={template.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-[#2C3E50] truncate">{template.title}</span>
                                <button onClick={() => addToFeatured(template.id)} className="text-sm text-green-600 hover:underline flex-shrink-0 ml-2">Add</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured Templates */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Featured Templates ({featuredIds.length}/10)</h2>
                    <div className="space-y-2 flex-grow overflow-y-auto max-h-[60vh]">
                        {featuredTemplates.map((template, index) => (
                             <div key={template.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <span className="font-semibold text-orange-800 truncate">{index + 1}. {template.title}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                     <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="px-1 disabled:opacity-20">↑</button>
                                     <button onClick={() => moveItem(index, 'down')} disabled={index === featuredTemplates.length - 1} className="px-1 disabled:opacity-20">↓</button>
                                    <button onClick={() => removeFromFeatured(template.id)} className="text-sm text-red-600 hover:underline">Remove</button>
                                </div>
                            </div>
                        ))}
                         {featuredTemplates.length === 0 && (
                            <p className="text-center text-gray-500 py-4">No templates featured yet. Add some from the left.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFeaturedManagerScreen;