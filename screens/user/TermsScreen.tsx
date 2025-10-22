import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeftIcon } from '../../components/shared/Icons';

const TermsScreen: React.FC = () => {
    const { appSettings } = useData();
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <div className="bg-white p-6 rounded-[30px] shadow-sm">
                <div className="flex items-center mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 mr-2">
                        <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
                    </button>
                    <h1 className="text-xl font-bold text-[#2C3E50]">Terms & Conditions</h1>
                </div>
                <div className="prose max-w-none text-[#2C3E50] whitespace-pre-wrap">
                    <p>{appSettings.terms}</p>
                </div>
            </div>
        </div>
    );
};

export default TermsScreen;