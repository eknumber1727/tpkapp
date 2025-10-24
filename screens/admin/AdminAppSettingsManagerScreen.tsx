import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { AppSettings } from '../../types';

const AppSettingsManagerScreen: React.FC = () => {
    const { appSettings, updateAppSettings, uploadAdminFile } = useData();
    const [settings, setSettings] = useState<AppSettings>(appSettings);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string>('');

    useEffect(() => {
        setSettings(appSettings);
        setIconPreview(appSettings.faviconUrl || '');
    }, [appSettings]);
    

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setSettings(prev => ({...prev, [name]: value }));
        }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                setErrorMessage('Icon file size should be less than 1MB.');
                return;
            }
            setErrorMessage('');
            setIconFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');
        let finalSettings = { ...settings };

        try {
            if (iconFile) {
                const fileExtension = iconFile.name.split('.').pop() || 'png';
                // Overwrite the same file for consistency
                const iconPath = `settings/favicon.${fileExtension}`; 
                const faviconUrl = await uploadAdminFile(iconFile, iconPath);
                finalSettings.faviconUrl = faviconUrl;
            }
            await updateAppSettings(finalSettings);
            setSettings(finalSettings);
            setIconFile(null);
            setSuccessMessage('Settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred while saving settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">App Settings</h1>
            <div className="bg-white p-6 rounded-[20px] shadow-sm max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6 divide-y divide-gray-200">
                    
                    {/* Page Content Section */}
                    <div className="pt-6 space-y-6">
                        <h2 className="text-xl font-bold text-[#2C3E50]">Page Content</h2>
                        <div>
                            <label htmlFor="aboutUs" className="text-lg font-semibold text-[#2C3E50] mb-2 block">About Us Page</label>
                            <textarea
                                id="aboutUs"
                                name="aboutUs"
                                value={settings.aboutUs}
                                onChange={handleChange}
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                            />
                        </div>
                        <div>
                            <label htmlFor="terms" className="text-lg font-semibold text-[#2C3E50] mb-2 block">Terms & Conditions Page</label>
                            <textarea
                                id="terms"
                                name="terms"
                                value={settings.terms}
                                onChange={handleChange}
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                            />
                        </div>
                        <div>
                            <label htmlFor="contactEmail" className="text-lg font-semibold text-[#2C3E50] mb-2 block">Contact Email</label>
                            <input
                                type="email"
                                id="contactEmail"
                                name="contactEmail"
                                value={settings.contactEmail}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                            />
                        </div>
                    </div>

                     {/* App Icon Section */}
                    <div className="pt-6 space-y-6">
                        <h2 className="text-xl font-bold text-[#2C3E50]">App Icon (Favicon)</h2>
                        <div>
                            <label htmlFor="favicon" className="text-lg font-semibold text-[#2C3E50] mb-2 block">Upload Icon</label>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Current Icon</p>
                                    <img src={iconPreview || '/icons/icon-192x192.png'} alt="Current Favicon" className="w-16 h-16 rounded-lg border bg-gray-100 object-contain p-1" />
                                </div>
                                <div className="flex-grow">
                                    <input
                                        type="file"
                                        id="favicon"
                                        name="favicon"
                                        onChange={handleIconChange}
                                        accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7A00] hover:file:bg-orange-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended: Square .png or .ico file, under 1MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Advertisement Settings Section */}
                    <div className="pt-6 space-y-6">
                        <h2 className="text-xl font-bold text-[#2C3E50]">Advertisement Settings</h2>
                         <div>
                            <label htmlFor="adsEnabled" className="text-lg font-semibold text-[#2C3E50] mb-2 flex items-center justify-between">
                                <span>Enable Ads</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="adsEnabled"
                                        name="adsEnabled"
                                        checked={settings.adsEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7A00]"></div>
                                </div>
                            </label>
                            <p className="text-sm text-gray-500 mt-1">Turn this on to display Google AdSense ads throughout the app.</p>
                        </div>
                        <div>
                            <label htmlFor="adSensePublisherId" className="text-lg font-semibold text-[#2C3E50] mb-2 block">AdSense Publisher ID</label>
                             <input
                                type="text"
                                id="adSensePublisherId"
                                name="adSensePublisherId"
                                value={settings.adSensePublisherId}
                                onChange={handleChange}
                                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                            />
                             <p className="text-sm text-gray-500 mt-1">Your unique AdSense identifier.</p>
                        </div>
                         <div>
                            <label htmlFor="adSenseSlotId" className="text-lg font-semibold text-[#2C3E50] mb-2 block">AdSense Banner Slot ID</label>
                             <input
                                type="text"
                                id="adSenseSlotId"
                                name="adSenseSlotId"
                                value={settings.adSenseSlotId}
                                onChange={handleChange}
                                placeholder="1234567890"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                            />
                            <p className="text-sm text-gray-500 mt-1">The ID for the specific banner ad unit.</p>
                        </div>
                    </div>
                    
                    {successMessage && <p className="text-green-500 text-center !mt-4">{successMessage}</p>}
                    {errorMessage && <p className="text-red-500 text-center !mt-4">{errorMessage}</p>}


                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save All Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppSettingsManagerScreen;