import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { SubmissionStatus } from '../../types';
import ImagePreviewModal from '../../components/shared/ImagePreviewModal';

const AdminSubmissionsManagerScreen: React.FC = () => {
    // FIX: Use templates to get all submissions
    const { templates, approveTemplate, rejectTemplate } = useData();
    
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    // FIX: Use templates to get all submissions
    const pendingSubmissions = templates.filter(t => t.status === SubmissionStatus.PENDING);
    
    const getStatusColor = (status: SubmissionStatus) => {
        switch (status) {
            case SubmissionStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
            case SubmissionStatus.APPROVED: return 'bg-green-100 text-green-700';
            case SubmissionStatus.REJECTED: return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    const handleViewImage = (url: string) => {
        setPreviewImageUrl(url);
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">Submissions Manager</h1>
                
                {/* Desktop Table */}
                <div className="bg-white rounded-[20px] shadow-sm overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Uploader</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Title</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Composite Preview</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Raw Files</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Status</th>
                                <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingSubmissions.map(sub => (
                                <tr key={sub.id} className="border-b last:border-b-0">
                                    <td className="p-4 text-[#2C3E50] font-mono text-xs">@{sub.uploader_username}</td>
                                    <td className="p-4 text-[#2C3E50]">{sub.title}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleViewImage(sub.composite_preview_url)}>
                                            <img src={sub.composite_preview_url} alt="Composite Preview" className="w-16 h-20 object-cover rounded-lg bg-gray-100 cursor-pointer" />
                                        </button>
                                    </td>
                                     <td className="p-4 text-xs">
                                         <button onClick={() => handleViewImage(sub.png_url)} className="text-blue-600 hover:underline block">View PNG</button>
                                         <button onClick={() => handleViewImage(sub.bg_preview_url)} className="text-blue-600 hover:underline block mt-1">View BG</button>
                                     </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(sub.status)}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <button
                                            onClick={() => approveTemplate(sub.id)}
                                            className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => rejectTemplate(sub.id)}
                                            className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-full"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {pendingSubmissions.length === 0 && (
                        <p className="text-center p-8 text-gray-500">No pending submissions found.</p>
                    )}
                </div>
                
                {/* Mobile Cards */}
                <div className="space-y-4 md:hidden">
                    {pendingSubmissions.map(sub => (
                        <div key={sub.id} className="bg-white rounded-[20px] shadow-sm p-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-[#2C3E50]">{sub.title}</h3>
                                    <p className="text-sm text-[#7F8C8D]">@{sub.uploader_username}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(sub.status)}`}>
                                    {sub.status}
                                </span>
                            </div>
                            <div className="flex gap-4 mt-4">
                                 <button onClick={() => handleViewImage(sub.composite_preview_url)} className="w-1/3">
                                    <img src={sub.composite_preview_url} alt="Composite Preview" className="w-full aspect-[4/5] object-cover rounded-lg bg-gray-100" />
                                </button>
                                <div className="text-sm">
                                    <p className="font-semibold text-[#2C3E50]">Raw Files:</p>
                                    <button onClick={() => handleViewImage(sub.png_url)} className="text-blue-600 hover:underline block mt-1">View PNG</button>
                                    <button onClick={() => handleViewImage(sub.bg_preview_url)} className="text-blue-600 hover:underline block mt-1">View BG</button>
                                </div>
                            </div>
                            <div className="mt-4 border-t pt-2 flex justify-end space-x-2">
                                <button
                                    onClick={() => approveTemplate(sub.id)}
                                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => rejectTemplate(sub.id)}
                                    className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-full"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                    {pendingSubmissions.length === 0 && (
                        <p className="text-center p-8 text-gray-500 bg-white rounded-[20px]">No pending submissions found.</p>
                    )}
                </div>
            </div>
            {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
        </>
    );
};

export default AdminSubmissionsManagerScreen;