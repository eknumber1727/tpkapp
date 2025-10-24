import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeftIcon, BellIcon } from '../../components/shared/Icons';

const UserNotificationsScreen: React.FC = () => {
    const { notifications } = useData();
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <div className="bg-white p-6 rounded-[30px] shadow-sm">
                <div className="flex items-center mb-6 relative">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 absolute left-0">
                        <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
                    </button>
                    <h1 className="text-xl font-bold text-[#2C3E50] text-center flex-grow">Notifications</h1>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div key={notif.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                <div className="flex-shrink-0 bg-orange-100 p-2 rounded-full mt-1">
                                    <BellIcon className="w-6 h-6 text-[#FF7A00]" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-bold text-[#2C3E50]">{notif.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                                    <p className="text-xs text-gray-400 mt-2 text-right">
                                        {new Date(notif.sent_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-[#7F8C8D]">You have no notifications yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserNotificationsScreen;
