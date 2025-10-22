import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AppSettings } from '../../types';

const AppSettingsManagerScreen: React.FC = () => {
    const { appSettings, updateAppSettings } = useData();
    const [settings, setSettings] = useState<AppSettings>(appSettings);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateAppSettings(settings);
        setSuccessMessage('Settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">App Settings</h1>
            <div className="bg-white p-6 rounded-[20px] shadow-sm max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="aboutUs" className="text-lg font-bold text-[#2C3E50] mb-2 block">About Us Page Content</label>
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
                        <label htmlFor="terms" className="text-lg font-bold text-[#2C3E50] mb-2 block">Terms & Conditions Page Content</label>
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
                        <label htmlFor="contactEmail" className="text-lg font-bold text-[#2C3E50] mb-2 block">Contact Email</label>
                        <input
                            type="email"
                            id="contactEmail"
                            name="contactEmail"
                            value={settings.contactEmail}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                        />
                    </div>
                    
                    {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}

                    <button
                        type="submit"
                        className="w-full mt-4 text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00]"
                    >
                        Save Settings
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AppSettingsManagerScreen;