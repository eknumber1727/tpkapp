import React, { useState } from 'react';
import { useData } from '../../context/DataContext';

const AdminNotificationsManagerScreen: React.FC = () => {
    const { sendNotification, notifications } = useData();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            setError('Title and message body cannot be empty.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await sendNotification(title, body);
            setTitle('');
            setBody('');
            setSuccess('Notification sent successfully!');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">Notifications Manager</h1>
            
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
            {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{success}</p></div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-[20px] shadow-sm">
                    <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Send New Notification</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-[#2C3E50] mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                                placeholder="e.g., New Diwali Templates!"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="body" className="block text-sm font-medium text-[#2C3E50] mb-1">
                                Message
                            </label>
                            <textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                                placeholder="Check out the latest trending templates in the app."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send to All Users'}
                        </button>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-[20px] shadow-sm">
                    <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Sent History</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {notifications.map(notif => (
                            <div key={notif.id} className="p-3 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#2C3E50]">{notif.title}</h3>
                                <p className="text-sm text-gray-600">{notif.body}</p>
                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    {new Date(notif.sent_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <p className="text-center text-gray-500 py-4">No notifications have been sent yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationsManagerScreen;
