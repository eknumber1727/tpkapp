import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LogoutIcon } from '../components/shared/Icons';
import { APP_NAME } from '../constants';

const VerifyEmailScreen: React.FC = () => {
    const { currentUser, resendVerificationEmail, logout } = useData();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResend = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await resendVerificationEmail();
            setMessage('A new verification email has been sent. Please check your inbox (and spam folder).');
        } catch (err: any) {
            setError(err.message || 'Failed to send email. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
            <div className="w-full max-w-md mx-auto bg-white p-8 rounded-[30px] shadow-lg text-center">
                <h1 className="text-2xl font-bold text-[#2C3E50] mb-2">
                    Verify Your Email
                </h1>
                <p className="text-center text-[#7F8C8D] mt-2 mb-6">
                    Welcome to {APP_NAME}! A verification link has been sent to <br />
                    <strong className="text-[#2C3E50]">{currentUser?.email}</strong>.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Please click the link in the email to activate your account. You might need to check your spam folder.
                </p>

                {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm mb-4">{message}</p>}
                {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm mb-4">{error}</p>}
                
                <div className="space-y-3">
                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-red-500 font-semibold"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailScreen;
