import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Sticker } from '../../types';
import { TrashIcon } from '../../components/shared/Icons';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const AdminStickerManagerScreen: React.FC = () => {
    const { stickers, addSticker, deleteSticker } = useData();
    const [newStickerName, setNewStickerName] = useState('');
    const [newStickerFile, setNewStickerFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stickerToDelete, setStickerToDelete] = useState<Sticker | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['image/png', 'image/gif'].includes(file.type)) {
                setError('Invalid file type. Please upload a PNG or GIF.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('File size should be less than 2MB.');
                return;
            }
            setError('');
            setNewStickerFile(file);
            setNewStickerName(file.name.split('.').slice(0, -1).join('.')); // Pre-fill name
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAddSticker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStickerName.trim() || !newStickerFile) {
            setError('Please provide a name and select a file.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await addSticker(newStickerName, newStickerFile);
            setNewStickerName('');
            setNewStickerFile(null);
            setPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setSuccess(`Sticker "${newStickerName}" added successfully.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (sticker: Sticker) => {
        setStickerToDelete(sticker);
        setIsModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleConfirmDelete = async () => {
        if (!stickerToDelete) return;
        try {
            await deleteSticker(stickerToDelete.id);
            setSuccess(`Sticker "${stickerToDelete.name}" deleted successfully.`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsModalOpen(false);
            setStickerToDelete(null);
            setTimeout(() => {
              setSuccess('');
              setError('');
            }, 5000);
        }
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">Sticker Manager</h1>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{success}</p></div>}

                {/* Add Sticker Form */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm mb-8">
                    <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Add New Sticker</h2>
                    <form onSubmit={handleAddSticker} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Sticker File (.png, .gif)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="image/png,image/gif"
                                className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7A00] hover:file:bg-orange-100"
                                required
                            />
                             {preview && <img src={preview} alt="preview" className="w-20 h-20 object-contain border rounded-md mt-2 bg-gray-100 p-1" />}
                        </div>
                        <div>
                            <label htmlFor="stickerName" className="block text-sm font-medium text-gray-700">Sticker Name</label>
                            <input
                                id="stickerName"
                                type="text"
                                value={newStickerName}
                                onChange={(e) => setNewStickerName(e.target.value)}
                                placeholder="e.g., Cool Sunglasses"
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg disabled:opacity-50"
                        >
                           {loading ? 'Uploading...' : 'Add Sticker'}
                        </button>
                    </form>
                </div>

                {/* Existing Stickers List */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm">
                    <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Existing Stickers</h2>
                    {stickers.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {stickers.map(sticker => (
                                <div key={sticker.id} className="relative group p-2 bg-gray-50 rounded-lg aspect-square flex flex-col items-center justify-center">
                                    <img src={sticker.url} alt={sticker.name} className="max-w-full max-h-full object-contain"/>
                                    <p className="text-xs text-center text-gray-500 truncate w-full absolute bottom-1">{sticker.name}</p>
                                    <button onClick={() => openDeleteModal(sticker)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No stickers uploaded yet.</p>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the sticker "${stickerToDelete?.name}"?`}
            />
        </>
    );
};

export default AdminStickerManagerScreen;