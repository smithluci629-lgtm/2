import React, { useState, useEffect } from 'react';
import PracticeTab from './components/PracticeTab';
import LeaderboardTab from './components/LeaderboardTab';
import NotesTab from './components/NotesTab';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { supabase } from './services/supabase';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [tab, setTab] = useState<'practice' | 'leaderboard' | 'notes'>('practice');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Load API keys from local storage on mount
  useEffect(() => {
    const savedKeys = JSON.parse(localStorage.getItem('gemini_api_keys') || '[]');
    setApiKeys(savedKeys);
  }, []);

  // Auth Listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string, email: string) => {
    // Try to get profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    // If no profile, insert one (handled mostly by DB triggers usually, but here manually just in case)
    if (!profile) {
       const newProfile = {
         id: uid,
         email: email,
         full_name: email.split('@')[0],
         avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}`,
         total_score: 0,
         total_lessons: 0
       };
       // Attempt insert if policy allows, otherwise it relies on supabase triggers
       // For this demo, we assume the table exists as per provided code
       const { error } = await supabase.from('profiles').insert(newProfile);
       if (!error) profile = newProfile;
    }
    
    if (profile) {
      setUser(profile as UserProfile);
    }
  };

  const handleSaveKeys = (keys: string[]) => {
    localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
    setApiKeys(keys);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTab('practice');
  };

  const updateStats = async () => {
    if (user) await fetchUserProfile(user.id, user.email);
  };

  return (
    <div className="min-h-screen text-textPrimary font-sans pb-10">
      {/* Top Navigation */}
      <div className="container mx-auto px-4 pt-6 mb-8">
        <div className="bg-bgPanel rounded-2xl p-4 border border-borderColor shadow-lg flex justify-between items-center relative z-20">
          <div className="hidden md:flex items-center gap-3 text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/20">
               <i className="fas fa-language"></i>
             </div>
             Loen
          </div>

          <div className="flex gap-4 items-center w-full md:w-auto justify-end">
             {user ? (
               <>
                 <div className="flex items-center gap-3 mr-2 bg-bgSecondary py-1.5 px-3 rounded-full border border-borderColor">
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full border border-textHighlight" />
                    <div className="hidden sm:block">
                       <div className="text-sm font-bold leading-none">{user.full_name}</div>
                       <div className="text-xs text-textSecondary font-mono">{user.total_score} pts</div>
                    </div>
                 </div>
                 <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl bg-bgSecondary border border-borderColor text-textSecondary hover:text-textPrimary hover:bg-bgHover transition-all flex items-center justify-center">
                    <i className="fas fa-cog"></i>
                 </button>
                 <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-red-500/10 border border-transparent text-errorColor hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <i className="fas fa-sign-out-alt"></i>
                 </button>
               </>
             ) : (
               <>
                 <button onClick={() => setShowSettings(true)} className="px-4 py-2 rounded-xl bg-bgSecondary border border-borderColor text-textSecondary hover:text-textPrimary hover:bg-bgHover transition-all flex items-center gap-2 text-sm font-semibold">
                    <i className="fas fa-cog"></i> <span className="hidden sm:inline">API Key</span>
                 </button>
                 <button onClick={() => setShowLogin(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm font-semibold">
                    <i className="fas fa-sign-in-alt"></i> Login
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex justify-center w-full max-w-lg mx-auto bg-bgPanel p-1.5 rounded-2xl border border-borderColor shadow-md relative z-20">
          {[
            { id: 'practice', icon: 'fa-book-open', label: 'Practice' },
            { id: 'leaderboard', icon: 'fa-trophy', label: 'Ranking' },
            { id: 'notes', icon: 'fa-sticky-note', label: 'Notes' }
          ].map((item) => (
             <button
               key={item.id}
               onClick={() => {
                 if ((item.id === 'leaderboard' || item.id === 'notes') && !user) {
                   setShowLogin(true);
                   return;
                 }
                 setTab(item.id as any);
               }}
               className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${tab === item.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgHover'}`}
             >
               <i className={`fas ${item.icon}`}></i> <span className="hidden sm:inline">{item.label}</span>
             </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 relative z-10">
         {tab === 'practice' && (
           <PracticeTab 
             apiKeys={apiKeys} 
             user={user} 
             onOpenSettings={() => setShowSettings(true)}
             onUpdateUserStats={updateStats}
           />
         )}
         {tab === 'leaderboard' && <LeaderboardTab user={user} />}
         {tab === 'notes' && <NotesTab user={user} onOpenLogin={() => setShowLogin(true)} />}
      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={handleSaveKeys} 
        initialKeys={apiKeys} 
      />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};

export default App;