import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Role, User } from '../../types';
import { SearchIcon } from '../../components/shared/Icons';

interface UserWithStats extends User {
    uploadCount: number;
    downloadCount: number;
}

const AdminUserManagerScreen: React.FC = () => {
    const { users, adminTemplates } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const usersWithStats = useMemo((): UserWithStats[] => {
        const statsMap = new Map<string, { uploadCount: number; downloadCount: number }>();

        // Pre-populate map for all users
        users.forEach(user => {
            statsMap.set(user.id, { uploadCount: 0, downloadCount: 0 });
        });

        // Calculate stats in a single loop over templates
        adminTemplates.forEach(template => {
            const userId = template.uploader_id;
            if (statsMap.has(userId)) {
                const currentStats = statsMap.get(userId)!;
                currentStats.uploadCount += 1;
                currentStats.downloadCount += (template.downloadCount || 0);
            }
        });

        return users.map(user => {
            const stats = statsMap.get(user.id) || { uploadCount: 0, downloadCount: 0 };
            return {
                ...user,
                uploadCount: stats.uploadCount,
                downloadCount: stats.downloadCount,
            };
        });
    }, [users, adminTemplates]);

    const filteredUsers = useMemo(() => {
        return usersWithStats.filter(user => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            if (!lowerSearchTerm) return true;
            return (
                user.name.toLowerCase().includes(lowerSearchTerm) ||
                user.email.toLowerCase().includes(lowerSearchTerm) ||
                user.creator_id.toLowerCase().includes(lowerSearchTerm)
            );
        }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [usersWithStats, searchTerm]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#2C3E50]">User Manager</h1>
            </div>

            <div className="relative mb-4">
                <input
                    type="search"
                    placeholder="Search by name, email, or creator ID..."
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
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">User</th>
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Role</th>
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Stats (Uploads/Downloads)</th>
                            <th className="p-4 text-sm font-semibold text-[#7F8C8D]">Joined On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b last:border-b-0">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={user.photo_url} alt={user.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-semibold text-[#2C3E50]">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                            <p className="text-xs text-gray-400 font-mono">{user.creator_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-[#2C3E50]">
                                    {user.uploadCount} / {user.downloadCount}
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white rounded-[20px] shadow-sm p-4">
                        <div className="flex items-start gap-4">
                            <img src={user.photo_url} alt={user.name} className="w-12 h-12 rounded-full" />
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-[#2C3E50]">{user.name}</h3>
                                        <p className="text-xs text-gray-500">{user.creator_id}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] rounded-full capitalize ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    <span>Uploads: <span className="font-semibold text-gray-700">{user.uploadCount}</span></span>
                                    <span className="mx-2">|</span>
                                    <span>Downloads: <span className="font-semibold text-gray-700">{user.downloadCount}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="bg-white rounded-[20px] shadow-sm p-8 text-center text-gray-500">
                    No users found.
                </div>
            )}
        </div>
    );
};

export default AdminUserManagerScreen;