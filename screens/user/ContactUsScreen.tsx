import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeftIcon } from '../../components/shared/Icons';

const ContactUsScreen: React.FC = () => {
    const { appSettings } = useData();
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <div className="bg-white p-6 rounded-[30px] shadow-sm">
                 <div className="flex items-center mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 mr-2">
                        <ChevronLeftIcon className="w-6 h-6 text-[#2C3E50]" />
                    </button>
                    <h1 className="text-xl font-bold text-[#2C3E50]">Contact Us</h1>
                </div>
                <div className="space-y-4 text-[#2C3E50]">
                    <p>
                        For any inquiries, support, or general questions, please feel free to contact us at our official email address:
                    </p>
                    <a href={`mailto:${appSettings.contactEmail}`} className="font-bold text-[#FF7A00] block text-center text-lg break-all">
                        {appSettings.contactEmail}
                    </a>
                    <p>
                        If you believe any content on our platform infringes on your copyright, please contact us at the same email address for takedown requests.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContactUsScreen;