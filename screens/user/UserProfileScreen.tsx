import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { LogoutIcon } from '../../components/shared/Icons';
import { SubmissionStatus, Template } from '../../types';

const UserProfileScreen: React.FC = () => {
  const { currentUser, logout, templates, getDownloadsForTemplate, updateUsername, submitSuggestion } = useData();
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState(currentUser?.name || '');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSuccess, setSuggestionSuccess] = useState('');

  useEffect(() => {
    setNewUsername(currentUser?.name || '');
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleUsernameChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setUsernameError('');
      setUsernameSuccess('');
      if (!currentUser || newUsername === currentUser.name) return;
      try {
          await updateUsername(newUsername);
          setUsernameSuccess('Username updated successfully!');
      } catch (err: any) {
          setUsernameError(err.toString());
      }
  }
  
  const handleSuggestionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!suggestion.trim()) return;
      submitSuggestion(suggestion);
      setSuggestion('');
      setSuggestionSuccess('Thank you for your feedback!');
      setTimeout(() => setSuggestionSuccess(''), 3000);
  }

  const { canChangeUsername, daysRemaining } = useMemo(() => {
    if (!currentUser?.lastUsernameChangeAt) return { canChangeUsername: true, daysRemaining: 0 };
    const lastChange = new Date(currentUser.lastUsernameChangeAt);
    const diffDays = (new Date().getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
    if (diffDays < 15) {
        return { canChangeUsername: false, daysRemaining: Math.ceil(15 - diffDays) };
    }
    return { canChangeUsername: true, daysRemaining: 0 };
  }, [currentUser]);
  
  const creatorInsights = useMemo(() => {
      if (!currentUser) return { submitted: 0, approved: 0, rejected: 0, totalDownloads: 0 };
      const mySubmissions = templates.filter(t => t.uploader_id === currentUser.id);
      const approvedSubmissions = mySubmissions.filter(t => t.status === SubmissionStatus.APPROVED);
      const totalDownloads = approvedSubmissions.reduce((sum, t) => sum + getDownloadsForTemplate(t.id), 0);
      
      return {
          submitted: mySubmissions.length,
          approved: approvedSubmissions.length,
          rejected: mySubmissions.filter(t => t.status === SubmissionStatus.REJECTED).length,
          totalDownloads
      }
  }, [currentUser, templates, getDownloadsForTemplate]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="p-4 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8">
        <img src={currentUser.photo_url} alt={currentUser.name} className="w-24 h-24 rounded-full shadow-lg border-4 border-white" />
        <h1 className="text-2xl font-bold text-[#2C3E50] mt-4">{currentUser.name}</h1>
        <div className="mt-2 text-sm text-[#7F8C8D] bg-gray-100 px-3 py-1 rounded-full">
            Creator ID: <span className="font-semibold text-[#2C3E50]">{currentUser.creator_id}</span>
        </div>
      </div>
      
      {/* Account Management */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Account Management</h2>
        <form onSubmit={handleUsernameChange}>
            <label className="block text-sm font-medium text-[#2C3E50] mb-1">Username</label>
            <div className="flex gap-2">
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] disabled:bg-gray-100" disabled={!canChangeUsername} />
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canChangeUsername || newUsername === currentUser.name}>Save</button>
            </div>
            {!canChangeUsername && <p className="text-xs text-[#7F8C8D] mt-2">You can change your username again in {daysRemaining} days.</p>}
            {usernameError && <p className="text-xs text-red-500 mt-2">{usernameError}</p>}
            {usernameSuccess && <p className="text-xs text-green-500 mt-2">{usernameSuccess}</p>}
        </form>
      </div>

      {/* Creator Insights */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Creator Insights</h2>
        <div className="grid grid-cols-2 gap-4 text-center">
            <div>
                <p className="text-2xl font-bold text-[#2C3E50]">{creatorInsights.submitted}</p>
                <p className="text-sm text-[#7F8C8D]">Submitted</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-[#FF7A00]">{creatorInsights.totalDownloads}</p>
                <p className="text-sm text-[#7F8C8D]">Total Downloads</p>
            </div>
            <div>
                <p className="text-xl font-bold text-green-500">{creatorInsights.approved}</p>
                <p className="text-sm text-[#7F8C8D]">Approved</p>
            </div>
            <div>
                <p className="text-xl font-bold text-red-500">{creatorInsights.rejected}</p>
                <p className="text-sm text-[#7F8C8D]">Rejected</p>
            </div>
        </div>
      </div>
      
       {/* App Suggestions */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">App Suggestion</h2>
        <p className="text-sm text-[#7F8C8D] mb-3">Have an idea for a new feature? Let us know!</p>
        <form onSubmit={handleSuggestionSubmit}>
            <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]" rows={3} placeholder="Describe your idea..."></textarea>
            <button type="submit" className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF7A00] text-[#3D2811] font-semibold rounded-lg disabled:opacity-50" disabled={!suggestion.trim()}>Submit Idea</button>
            {suggestionSuccess && <p className="text-xs text-green-500 mt-2 text-center">{suggestionSuccess}</p>}
        </form>
      </div>
      
      {/* Links */}
      <div className="bg-white p-4 rounded-[30px] shadow-sm divide-y">
          <Link to="/about" className="block p-3 text-[#2C3E50] font-semibold">About Us</Link>
          <Link to="/terms" className="block p-3 text-[#2C3E50] font-semibold">Terms & Conditions</Link>
          <Link to="/contact" className="block p-3 text-[#2C3E50] font-semibold">Contact Us</Link>
      </div>

      {/* Logout */}
      <div className="mt-4">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-[20px] shadow-sm text-red-500 font-semibold">
          <LogoutIcon className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfileScreen;