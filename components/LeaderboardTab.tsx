import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';

interface LeaderboardTabProps {
  user: UserProfile | null;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ user }) => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(50);

      if (data) {
        const mapped: UserProfile[] = data.map((p: any) => ({
          id: p.id,
          email: p.email || 'unknown',
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          total_score: p.total_score || 0,
          total_lessons: p.total_lessons || 0
        }));
        setLeaders(mapped);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-neonPurple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="max-w-xl mx-auto glass-card rounded-3xl p-10 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-trophy text-4xl text-white/20"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Data Yet</h3>
        <p className="text-textSecondary">Be the first to join the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-scale pb-20">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="p-3 glass rounded-2xl border border-neonPurple/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <i className="fas fa-trophy text-xl text-neonPurple"></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Global Rankings</h2>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-bold">Top Contributors</p>
        </div>
      </div>

      {leaders.map((leader, index) => {
        const rank = index + 1;
        const isMe = user?.id === leader.id;

        // Rank Styles
        let rankStyle = "text-textSecondary font-bold";
        let cardStyle = "glass-panel hover:bg-white/10";
        if (rank === 1) {
          rankStyle = "text-neonGreen drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
          cardStyle = "bg-gradient-to-r from-neonGreen/10 to-transparent border-neonGreen/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
        } else if (rank === 2) {
          rankStyle = "text-neonBlue drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]";
          cardStyle = "bg-gradient-to-r from-neonBlue/10 to-transparent border-neonBlue/30";
        } else if (rank === 3) {
          rankStyle = "text-neonPink drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]";
          cardStyle = "bg-gradient-to-r from-neonPink/10 to-transparent border-neonPink/30";
        }

        if (isMe) {
          cardStyle = "bg-neonPurple/20 border-neonPurple shadow-[0_0_30px_rgba(139,92,246,0.2)] sticky top-24 z-20 scale-[1.02]";
        }

        return (
          <div
            key={leader.id}
            className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 transition-all duration-300 group ${cardStyle}`}
          >
            <div className={`w-10 text-center text-xl font-display ${rankStyle} flex flex-col items-center justify-center`}>
              {rank <= 3 && <i className="fas fa-crown text-[10px] mb-1 animate-float"></i>}
              {rank}
            </div>

            <div className="relative">
              <img
                src={leader.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.full_name || leader.email)}`}
                alt="Avatar"
                className={`w-12 h-12 rounded-xl object-cover bg-black/50 ${rank <= 3 ? 'ring-2 ring-white/20' : ''}`}
              />
              {isMe && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-neonGreen rounded-full border-2 border-black flex items-center justify-center text-[8px] text-black font-bold">✓</div>}
            </div>

            <div className="flex-1 min-w-0">
              <div className={`font-bold text-lg truncate ${isMe ? 'text-white' : 'text-textPrimary group-hover:text-white transition-colors'}`}>
                {leader.full_name || leader.email.split('@')[0]}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30 w-2/3"></div>
                </div>
                <span className="text-[10px] text-textSecondary uppercase font-bold tracking-wide">
                  {leader.total_lessons} Missions
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-xl font-black ${rank <= 3 ? 'text-white' : 'text-neonPurple'}`}>
                {leader.total_score}
              </div>
              <div className="text-[10px] text-textSecondary uppercase font-bold tracking-widest">XP</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaderboardTab;