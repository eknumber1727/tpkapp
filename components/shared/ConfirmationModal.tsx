import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white p-8 rounded-[30px] shadow-lg text-center max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-[#2C3E50]">{title}</h2>
                <p className="text-[#7F8C8D] mt-2 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 font-semibold text-[#2C3E50] bg-gray-200 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-8 py-2 font-semibold text-white bg-red-500 rounded-lg"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;