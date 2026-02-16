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
    <div className="min-h-screen mobile-pb">
      {/* Top Controls Area */}
      <div className="container mx-auto px-4 py-4 flex justify-end items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 bg-bgPanel py-1.5 px-3 rounded-full shadow-sm border border-bgSecondary">
              <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full border border-brandHighlight" />
              <div className="hidden sm:block text-right">
                <div className="text-sm font-bold leading-none">{user.full_name}</div>
                <div className="text-xs text-brandHighlight font-mono">{user.total_score} pts</div>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl bg-bgPanel text-textSecondary hover:text-textPrimary hover:shadow-lg transition-all flex items-center justify-center">
              <i className="fas fa-cog"></i>
            </button>
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-red-500/10 text-accentRed hover:bg-accentRed hover:text-white hover:shadow-lg transition-all flex items-center justify-center">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl bg-bgPanel text-textSecondary hover:text-textPrimary hover:shadow-lg transition-all flex items-center justify-center">
              <i className="fas fa-cog"></i>
            </button>
            <button onClick={() => setShowLogin(true)} className="px-4 py-2 rounded-xl bg-brandPrimary text-white shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              Login
            </button>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pb-24 md:pb-8 max-w-4xl">
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-bgPanel border-t border-bgSecondary px-6 py-3 flex justify-around items-center z-50 md:hidden pb-safe">
        {[
          { id: 'practice', icon: 'fa-book-open', label: 'Practice' },
          { id: 'leaderboard', icon: 'fa-trophy', label: 'Rank' },
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
            className={`flex flex-col items-center gap-1 transition-all ${tab === item.id ? 'text-brandHighlight transform scale-110' : 'text-textSecondary hover:text-textPrimary'}`}
          >
            <i className={`fas ${item.icon} text-xl`}></i>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Desktop Side Navigation (Hidden on Mobile) */}
      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 bg-bgPanel p-2 rounded-2xl flex-col gap-2 border border-bgSecondary shadow-xl z-40">
        {[
          { id: 'practice', icon: 'fa-book-open', label: 'Practice' },
          { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
          { id: 'notes', icon: 'fa-sticky-note', label: 'My Notes' }
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
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${tab === item.id ? 'bg-brandHighlight text-white shadow-lg' : 'text-textSecondary hover:bg-bgSecondary hover:text-textPrimary'}`}
            title={item.label}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
          </button>
        ))}
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