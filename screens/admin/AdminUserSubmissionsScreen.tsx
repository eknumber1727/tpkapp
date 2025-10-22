import React from 'react';
import { useData } from '../../context/DataContext';
// FIX: Changed RequestStatus to SubmissionStatus as it is the correct type for template submissions.
import { SubmissionStatus } from '../../types';

// FIX: Renamed component to match filename and purpose.
const AdminUserSubmissionsScreen: React.FC = () => {
    // FIX: Replaced incorrect destructured properties with correct ones from DataContext.
    const { templates, approveTemplate, rejectTemplate } = useData();

    // FIX: Adjusted getStatusColor to match SubmissionStatus enum values.
    const getStatusColor = (status: SubmissionStatus) => {
        switch (status) {
            case SubmissionStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
            case SubmissionStatus.APPROVED: return 'bg-green-100 text-green-700';
            case SubmissionStatus.REJECTED: return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    return (
        <div>
            {/* FIX: Updated title to reflect content. */}
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">User Submissions</h1>
            <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">User ID</th>
                            {/* FIX: Changed column header from "Request Text" to "Title". */}
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Title</th>
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Status</th>
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* FIX: Mapped over 'templates' instead of non-existent 'templateSubmissions'. */}
                        {templates.sort((a,b) => (a.status === 'pending' ? -1 : 1)).map(submission => (
                            <tr key={submission.id} className="border-b last:border-b-0">
                                {/* FIX: Corrected property access from 'user_id' to 'uploader_id' on the Template type. */}
                                <td className="p-4 text-[#2C3E50] font-mono text-xs">{submission.uploader_id}</td>
                                {/* FIX: Displaying submission title instead of non-existent text_request. */}
                                <td className="p-4 text-[#2C3E50]">{submission.title}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(submission.status)}`}>
                                        {submission.status}
                                    </span>
                                </td>
                                <td className="p-4 space-x-2">
                                    {/* FIX: Logic now handles PENDING status from SubmissionStatus. */}
                                    {submission.status === SubmissionStatus.PENDING && (
                                        <>
                                            <button
                                                // FIX: Using 'approveTemplate' function from context.
                                                onClick={() => approveTemplate(submission.id)}
                                                className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                // FIX: Using 'rejectTemplate' function from context.
                                                onClick={() => rejectTemplate(submission.id)}
                                                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-full"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {/* FIX: Check length of 'templates' to determine if there are any submissions. */}
                 {templates.length === 0 && (
                    <p className="text-center p-8 text-gray-500">No submissions found.</p>
                )}
            </div>
        </div>
    );
};

// FIX: Exporting corrected component name.
export default AdminUserSubmissionsScreen;