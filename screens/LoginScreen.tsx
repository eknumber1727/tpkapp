import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { APP_NAME } from '../constants';
import { GoogleIcon } from '../components/shared/Icons';

const LoginScreen: React.FC = () => {
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { loginWithGoogle } = useData();

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-[30px] shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#2C3E50] mb-2">
          {APP_NAME}
        </h1>
        <p className="text-center text-[#7F8C8D] mt-2 mb-8">
            Sign in to continue
        </p>

        <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5" />
              <span className="font-semibold text-[#2C3E50]">
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </button>
            {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;