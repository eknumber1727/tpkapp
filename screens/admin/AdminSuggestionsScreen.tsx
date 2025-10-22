import React from 'react';
import { useData } from '../../context/DataContext';

const AdminSuggestionsScreen: React.FC = () => {
    const { suggestions } = useData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">User Suggestions</h1>
            
            <div className="space-y-4">
                {suggestions.map(suggestion => (
                    <div key={suggestion.id} className="bg-white rounded-[20px] shadow-sm p-4">
                        <p className="text-[#2C3E50]">{suggestion.text}</p>
                        <div className="mt-3 border-t pt-2 text-xs text-[#7F8C8D] flex justify-between items-center">
                            <span>By: <span className="font-semibold text-[#2C3E50]">{suggestion.user_name}</span></span>
                             <span>{new Date(suggestion.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
                {suggestions.length === 0 && (
                    <div className="bg-white rounded-[20px] shadow-sm p-8 text-center">
                        <p className="text-[#7F8C8D]">No user suggestions have been submitted yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSuggestionsScreen;