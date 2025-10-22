import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { APP_NAME } from '../constants';
import { Role, User } from '../types';

const LoginScreen: React.FC = () => {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const navigate = useNavigate();
  const { login, startSession } = useData();

  // FIX: Converted to an async function to correctly handle the Promise returned by `login`.
  // This resolves errors related to accessing properties on a Promise and ensures
  // user data is available before proceeding.
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === Role.ADMIN) {
        setPendingUser(user);
        setStep('2fa');
      } else {
        startSession(user);
        navigate('/');
      }
    } catch (err) {
      setError('Invalid email or password.');
    }
  };
  
  const handle2faSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be a dynamic code. For demo, it's hardcoded.
    if (securityCode === '123456' && pendingUser) {
        startSession(pendingUser);
        navigate('/');
    } else {
        setError('Invalid security code.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-[30px] shadow-lg">
        <div className="flex justify-center mb-4">
          <img src="/logo192.png" alt="Timepass Katta Logo" className="w-24 h-24" />
        </div>
        <h1 className="text-3xl font-bold text-center text-[#2C3E50]">
          {APP_NAME}
        </h1>
        <p className="text-center text-[#7F8C8D] mt-2 mb-6">
            {step === 'credentials' ? 'Login to continue' : 'Admin Security Check'}
        </p>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[#2C3E50] mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="e.g., user@test.com"
                required
              />
            </div>
             <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[#2C3E50] mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="Enter password"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] hover:opacity-90 transition-opacity"
            >
              Login
            </button>
             <div className="mt-4 text-xs text-center text-gray-400">
                <p>Admin: admin@test.com (adminpass)</p>
                <p>User: user@test.com (userpass)</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handle2faSubmit}>
            <p className="text-sm text-center text-[#2C3E50] mb-4">A security code is required to access the admin panel. Please enter the one-time code.</p>
            <div className="mb-4">
              <label htmlFor="securityCode" className="block text-sm font-medium text-[#2C3E50] mb-1">
                One-Time Security Code
              </label>
              <input
                type="text"
                id="securityCode"
                value={securityCode}
                onChange={(e) => {
                  setSecurityCode(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="Enter 6-digit code"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] hover:opacity-90 transition-opacity"
            >
              Verify & Enter
            </button>
             <div className="mt-4 text-xs text-center text-gray-400">
                <p>Demo Security Code: <span className="font-mono">123456</span></p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;