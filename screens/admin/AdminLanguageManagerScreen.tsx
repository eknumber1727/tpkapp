import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Language } from '../../types';
import { TrashIcon } from '../../components/shared/Icons';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const AdminLanguageManagerScreen: React.FC = () => {
    const { languages, addLanguage, deleteLanguage } = useData();
    const [newLanguageName, setNewLanguageName] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [languageToDelete, setLanguageToDelete] = useState<Language | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleAddLanguage = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newLanguageName.trim()) {
            try {
                await addLanguage(newLanguageName);
                setNewLanguageName('');
                setSuccess(`Language "${newLanguageName}" added successfully.`);
                setTimeout(() => setSuccess(''), 3000);
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    const openDeleteModal = (language: Language) => {
        setLanguageToDelete(language);
        setIsModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleConfirmDelete = async () => {
        if (!languageToDelete) return;
        try {
            await deleteLanguage(languageToDelete.id);
            setSuccess(`Language "${languageToDelete.name}" deleted successfully.`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsModalOpen(false);
            setLanguageToDelete(null);
            setTimeout(() => {
              setSuccess('');
              setError('');
            }, 5000);
        }
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">Language Manager</h1>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{success}</p></div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Language Form */}
                    <div className="bg-white p-6 rounded-[20px] shadow-sm">
                        <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Add New Language</h2>
                        <form onSubmit={handleAddLanguage} className="flex gap-2">
                            <input
                                type="text"
                                value={newLanguageName}
                                onChange={(e) => setNewLanguageName(e.target.value)}
                                placeholder="e.g., Marathi"
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                                required
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg"
                            >
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Existing Languages List */}
                    <div className="bg-white p-6 rounded-[20px] shadow-sm">
                        <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Existing Languages</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {languages.map(language => (
                                <div key={language.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-[#2C3E50]">{language.name}</span>
                                    <button onClick={() => openDeleteModal(language)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                             {languages.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No languages created yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the language "${languageToDelete?.name}"? This action cannot be undone.`}
            />
        </>
    );
};

export default AdminLanguageManagerScreen;