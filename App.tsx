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
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();

    if (!profile) {
      const newProfile = {
        id: uid,
        email: email,
        full_name: email.split('@')[0],
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`,
        total_score: 0,
        total_lessons: 0
      };
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
    <div className="min-h-screen text-textPrimary selection:bg-neonPurple/30">

      {/* Dynamic Background Elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-neonPurple/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-neonBlue/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {/* Top Navbar */}
      <nav className="fixed top-0 inset-x-0 glass z-50 h-16 px-4 md:px-8 flex items-center justify-between border-b border-glassBorder">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neonBlue to-neonPurple flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <i className="fas fa-cube text-white text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight text-white hidden sm:block">Loen<span className="text-neonPurple">.AI</span></span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-2 border border-neonPurple/30 relative overflow-hidden group">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 mr-1">
                  <i className="fas fa-fire text-orange-500 animate-pulse"></i>
                  <span className="font-bold text-orange-400">1</span>
                </div>
                <img src={user.avatar_url} alt="Profile" className="w-6 h-6 rounded-full ring-2 ring-neonPurple/50" />
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-white leading-none">{user.full_name}</div>
                  <div className="text-[10px] text-neonPurple font-mono">{user.total_score} XP</div>
                </div>
              </div>
              <button onClick={() => setShowSettings(true)} className="glass-button w-9 h-9 rounded-lg flex items-center justify-center text-textSecondary hover:text-white">
                <i className="fas fa-cog"></i>
              </button>
              <button onClick={handleLogout} className="glass-button w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(true)} className="p-2 text-textSecondary hover:text-white transition-colors">
                <i className="fas fa-cog"></i>
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="px-5 py-2 rounded-lg bg-white text-bgBody font-bold text-sm hover:bg-neonPurple hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-28 md:pb-10 max-w-5xl relative z-10">
        <div className="animate-fade-scale">
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
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 glass z-50 h-20 pb-safe md:hidden flex justify-around items-center border-t border-glassBorder mx-4 mb-4 rounded-2xl shadow-2xl">
        {[
          { id: 'practice', icon: 'fa-brain', label: 'Practice' },
          { id: 'leaderboard', icon: 'fa-chart-simple', label: 'Rank' },
          { id: 'notes', icon: 'fa-bolt', label: 'Notes' }
        ].map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if ((item.id === 'leaderboard' || item.id === 'notes') && !user) {
                  setShowLogin(true);
                  return;
                }
                setTab(item.id as any);
              }}
              className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${isActive ? 'text-white' : 'text-textSecondary hover:text-white'}`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-b from-neonPurple/20 to-transparent rounded-2xl blur-sm"></div>
              )}
              <i className={`fas ${item.icon} text-xl mb-1 relative z-10 ${isActive ? 'text-neonPurple drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''} transition-all`}></i>
              <span className={`text-[10px] font-bold tracking-wider relative z-10 ${isActive ? 'text-white' : ''}`}>{item.label}</span>

              {/* Active Indicator Dot */}
              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-neonPurple rounded-full shadow-[0_0_5px_#8b5cf6]"></div>}
            </button>
          );
        })}
      </div>

      {/* Desktop Side Nav */}
      <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col gap-4 z-40">
        {[
          { id: 'practice', icon: 'fa-brain', label: 'Practice' },
          { id: 'leaderboard', icon: 'fa-chart-simple', label: 'Leaderboard' },
          { id: 'notes', icon: 'fa-bolt', label: 'Quick Notes' }
        ].map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if ((item.id === 'leaderboard' || item.id === 'notes') && !user) {
                  setShowLogin(true);
                  return;
                }
                setTab(item.id as any);
              }}
              className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border ${isActive ? 'bg-neonPurple/10 border-neonPurple text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'glass-card text-textSecondary hover:text-white border-transparent hover:border-white/20'}`}
            >
              <i className={`fas ${item.icon} text-xl transition-transform group-hover:scale-110 ${isActive ? 'text-neonPurple' : ''}`}></i>

              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-1.5 glass rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSave={handleSaveKeys} initialKeys={apiKeys} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};

export default App;