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
        // Map to our UserProfile type safely
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
    return <div className="text-center py-20 text-textSecondary animate-pulse"><i className="fas fa-circle-notch fa-spin text-3xl"></i></div>;
  }

  if (leaders.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-bgPanel rounded-3xl p-10 text-center border-2 border-bgSecondary">
        <i className="fas fa-trophy text-6xl mb-6 text-bgSecondary block"></i>
        <h3 className="text-2xl font-bold text-textPrimary font-display">No Data Yet</h3>
        <p className="text-textSecondary mt-2">Be the first to join the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6 px-2">
        <span className="bg-accentYellow/20 text-accentYellow p-3 rounded-2xl"><i className="fas fa-trophy text-xl"></i></span>
        <h2 className="text-2xl font-bold font-display text-textPrimary">Leaderboard</h2>
      </div>

      {leaders.map((leader, index) => {
        const rank = index + 1;
        let rankColor = "text-textSecondary font-bold";
        let borderColor = "border-bgSecondary";
        let scaleClass = "";

        if (rank === 1) {
          rankColor = "text-accentYellow";
          borderColor = "border-accentYellow";
        } else if (rank === 2) {
          rankColor = "text-gray-300";
          borderColor = "border-gray-400";
        } else if (rank === 3) {
          rankColor = "text-orange-400";
          borderColor = "border-orange-500";
        }

        const isMe = user?.id === leader.id;

        return (
          <div
            key={leader.id}
            className={`flex items-center gap-4 p-4 rounded-2xl bg-bgPanel border-b-4 transition-all ${isMe ? 'border-brandHighlight bg-bgPanel ring-2 ring-brandHighlight/30 z-10' : `${borderColor} hover:bg-bgSecondary`} ${scaleClass}`}
          >
            <div className={`w-10 text-center text-xl font-display ${rankColor}`}>
              {rank <= 3 ? <i className="fas fa-crown mb-1 block text-sm"></i> : null}
              {rank}
            </div>

            <img
              src={leader.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.full_name || leader.email)}`}
              alt="Avatar"
              className="w-12 h-12 rounded-xl border-2 border-bgSecondary bg-bgBody object-cover"
            />

            <div className="flex-1 min-w-0">
              <div className={`font-bold text-lg truncate ${isMe ? 'text-brandHighlight' : 'text-textPrimary'}`}>
                {leader.full_name || leader.email.split('@')[0]}
                {isMe && <span className="ml-2 text-[10px] bg-brandHighlight text-white px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
              </div>
              <div className="text-textSecondary text-xs font-bold uppercase tracking-wide opacity-70">
                {leader.total_lessons} lessons
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-extrabold text-brandSecondary">
                {leader.total_score}
              </div>
              <div className="text-[10px] text-textSecondary uppercase font-bold">XP</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaderboardTab;