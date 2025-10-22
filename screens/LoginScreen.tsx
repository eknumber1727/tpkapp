import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { APP_NAME } from '../constants';
import { Role, User } from '../types';

const LoginScreen: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const navigate = useNavigate();
  const { signup, login, startSession } = useData();

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginView) {
        const user = await login(email, password);
        if (user.role === Role.ADMIN) {
          setPendingUser(user);
          setStep('2fa');
        } else {
          startSession(user);
          navigate('/');
        }
      } else {
        // Sign Up
        await signup(name, email, password);
        // The onAuthStateChanged listener in DataContext will handle login after signup
        navigate('/');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      }
      else {
        setError(err.message || 'An unknown error occurred.');
      }
    } finally {
        setLoading(false);
    }
  };
  
  const handle2faSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityCode === '123456' && pendingUser) {
        startSession(pendingUser);
        navigate('/');
    } else {
        setError('Invalid security code.');
    }
  }

  const toggleView = () => {
      setIsLoginView(!isLoginView);
      setError('');
      setStep('credentials');
      setPendingUser(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-[30px] shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#2C3E50] mb-2">
          {APP_NAME}
        </h1>
        <p className="text-center text-[#7F8C8D] mt-2 mb-6">
            {step === 'credentials' ? (isLoginView ? 'Login to continue' : 'Create an account') : 'Admin Security Check'}
        </p>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialSubmit}>
            {!isLoginView && (
                 <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-[#2C3E50] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
            )}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[#2C3E50] mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="e.g., user@example.com"
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="Enter password"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-[#3D2811] font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF7A00] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLoginView ? 'Login' : 'Sign Up')}
            </button>
             <div className="mt-6 text-center text-sm">
                <button type="button" onClick={toggleView} className="text-[#7F8C8D] hover:text-[#2C3E50]">
                    {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
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
                onChange={(e) => setSecurityCode(e.target.value)}
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