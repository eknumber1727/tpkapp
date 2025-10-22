import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Category, CategoryName } from '../../types';
import { TrashIcon } from '../../components/shared/Icons';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const AdminCategoryManagerScreen: React.FC = () => {
    const { categories, addCategory, deleteCategory } = useData();
    const [newCategoryName, setNewCategoryName] = useState<CategoryName>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newCategoryName.trim()) {
            addCategory(newCategoryName);
            setNewCategoryName('');
            setSuccess(`Category "${newCategoryName}" added successfully.`);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const openDeleteModal = (category: Category) => {
        setCategoryToDelete(category);
        setIsModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleConfirmDelete = () => {
        if (!categoryToDelete) return;
        try {
            deleteCategory(categoryToDelete.id);
            setSuccess(`Category "${categoryToDelete.name}" deleted successfully.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsModalOpen(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">Category Manager</h1>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{success}</p></div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Category Form */}
                    <div className="bg-white p-6 rounded-[20px] shadow-sm">
                        <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Add New Category</h2>
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g., Trending"
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

                    {/* Existing Categories List */}
                    <div className="bg-white p-6 rounded-[20px] shadow-sm">
                        <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Existing Categories</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {categories.map(category => (
                                <div key={category.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-[#2C3E50]">{category.name}</span>
                                    <button onClick={() => openDeleteModal(category)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                             {categories.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No categories created yet.</p>
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
                message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action cannot be undone.`}
            />
        </>
    );
};

export default AdminCategoryManagerScreen;