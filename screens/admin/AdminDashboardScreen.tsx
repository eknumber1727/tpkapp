import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { SubmissionStatus } from '../../types';

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <p className="text-[#7F8C8D] text-sm">{title}</p>
        <p className="text-3xl font-bold text-[#2C3E50]">{value}</p>
    </div>
);

const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  // FIX: Removed `templateSubmissions` from destructuring as it does not exist on DataContextType.
  const { templates, downloads, users } = useData();
  
  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.is_active).length,
    // FIX: Calculated pending submissions from the `templates` array.
    pendingSubmissions: templates.filter(r => r.status === SubmissionStatus.PENDING).length,
    totalDownloads: downloads.length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Templates" value={stats.totalTemplates} />
        <StatCard title="Active Templates" value={stats.activeTemplates} />
        <StatCard title="Pending Submissions" value={stats.pendingSubmissions} />
        <StatCard title="Total Downloads" value={stats.totalDownloads} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-[20px] shadow-sm">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Quick Actions</h2>
            <div className="flex gap-4">
                <button onClick={() => navigate('/templates')} className="px-6 py-3 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg">Manage Templates</button>
                <button onClick={() => navigate('/submissions')} className="px-6 py-3 bg-white text-[#2C3E50] font-semibold rounded-lg shadow-md">Review Submissions</button>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] shadow-sm">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Users</h2>
             <div className="overflow-y-auto max-h-48">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="font-semibold text-[#7F8C8D] pb-2">User ID</th>
                            <th className="font-semibold text-[#7F8C8D] pb-2">Creator ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="py-1 text-[#2C3E50]">{user.id}</td>
                                <td className="py-1 text-[#2C3E50] font-mono">{user.creator_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;