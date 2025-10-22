import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { SubmissionStatus, Template } from '../../types';
import { SearchIcon } from '../../components/shared/Icons';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const getStatusChipClass = (status: SubmissionStatus) => {
    switch(status) {
        case SubmissionStatus.APPROVED: return 'bg-green-100 text-green-700';
        case SubmissionStatus.REJECTED: return 'bg-red-100 text-red-700';
        case SubmissionStatus.PENDING:
        default:
            return 'bg-yellow-100 text-yellow-700';
    }
}

const AdminTemplateManagerScreen: React.FC = () => {
    const { templates, deleteTemplate } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            if (!lowerSearchTerm) return true;
            return (
                template.title.toLowerCase().includes(lowerSearchTerm) ||
                template.uploader_username.toLowerCase().includes(lowerSearchTerm) ||
                template.status.toLowerCase().includes(lowerSearchTerm) ||
                template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
            );
        });
    }, [templates, searchTerm]);

    const openDeleteModal = (template: Template) => {
        setTemplateToDelete(template);
        setIsModalOpen(true);
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleConfirmDelete = async () => {
        if (!templateToDelete) return;
        try {
            await deleteTemplate(templateToDelete.id);
            setSuccessMessage(`Template "${templateToDelete.title}" deleted successfully.`);
        } catch (error: any) {
            setErrorMessage(`Failed to delete template: ${error.message}`);
        } finally {
            setIsModalOpen(false);
            setTemplateToDelete(null);
            setTimeout(() => {
                setSuccessMessage('');
                setErrorMessage('');
            }, 5000);
        }
    };

    return (
        <>
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-[#2C3E50]">Template Manager</h1>
                    <button onClick={() => navigate('/create-template')} className="px-4 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg w-full sm:w-auto">Add New Template</button>
                </div>

                {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{successMessage}</p></div>}
                {errorMessage && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{errorMessage}</p></div>}


                <div className="relative mb-4">
                    <input
                        type="search"
                        placeholder="Search by title, uploader, tag, status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-full shadow-sm text-[#2C3E50] placeholder-[#7F8C8D] focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[#7F8C8D]" />
                </div>
                
                {/* Desktop Table */}
                <div className="bg-white rounded-[20px] shadow-sm overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Title</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Category</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Uploader</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Status</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTemplates.map(template => (
                                <tr key={template.id} className="border-b last:border-b-0">
                                    <td className="p-4 text-[#2C3E50]">{template.title}</td>
                                    <td className="p-4 text-[#2C3E50]">{template.category}</td>
                                    <td className="p-4 text-[#2C3E50] text-xs">@{template.uploader_username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusChipClass(template.status)}`}>
                                            {template.status}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-4">
                                        <button onClick={() => navigate(`/templates/${template.id}/edit`)} className="text-sm text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => openDeleteModal(template)} className="text-sm text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-4 md:hidden">
                    {filteredTemplates.map(template => (
                        <div key={template.id} className="bg-white rounded-[20px] shadow-sm p-4">
                            <div className="flex justify-between items-start">
                                 <div>
                                    <h3 className="font-bold text-[#2C3E50]">{template.title}</h3>
                                    <p className="text-sm text-[#7F8C8D]">{template.category}</p>
                                    <p className="text-xs text-[#7F8C8D]">@{template.uploader_username}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusChipClass(template.status)}`}>
                                    {template.status}
                                </span>
                            </div>
                            <div className="mt-4 border-t pt-2 flex justify-end space-x-4">
                                <button onClick={() => navigate(`/templates/${template.id}/edit`)} className="text-sm text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => openDeleteModal(template)} className="text-sm text-red-600 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                 {filteredTemplates.length === 0 && (
                    <div className="bg-white rounded-[20px] shadow-sm p-8 text-center text-gray-500">
                        No templates found for your search.
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete "${templateToDelete?.title}"? This action cannot be undone.`}
            />
        </>
    );
};

export default AdminTemplateManagerScreen;