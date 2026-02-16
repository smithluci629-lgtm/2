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
    return <div className="text-center py-20 text-textSecondary"><i className="fas fa-spinner fa-spin text-3xl"></i></div>;
  }

  if (leaders.length === 0) {
    return (
       <div className="max-w-3xl mx-auto bg-bgPanel rounded-xl p-10 text-center border border-borderColor">
          <i className="fas fa-trophy text-5xl mb-4 text-textSecondary/30"></i>
          <h3 className="text-xl font-bold text-textPrimary">No Data Yet</h3>
          <p className="text-textSecondary">Be the first to complete a lesson!</p>
       </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-bgPanel rounded-xl border border-borderColor shadow-lg p-6 animate-fade-in-up">
       <div className="mb-6 flex items-center gap-3 border-b border-borderColor pb-4">
         <i className="fas fa-trophy text-accentYellow text-2xl"></i>
         <h2 className="text-xl font-bold text-textPrimary">Global Ranking</h2>
       </div>

       <div className="space-y-3">
         {leaders.map((leader, index) => {
           const rank = index + 1;
           let rankClass = "bg-bgPanel text-textSecondary border border-borderColor";
           let rankIcon = null;

           if (rank === 1) {
              rankClass = "bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 shadow-lg shadow-yellow-500/20 border-none";
              rankIcon = <i className="fas fa-crown text-xs mb-0.5"></i>;
           } else if (rank === 2) {
              rankClass = "bg-gradient-to-br from-slate-300 to-slate-400 text-gray-900 shadow-lg border-none";
           } else if (rank === 3) {
              rankClass = "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-lg border-none";
           }

           const isMe = user?.id === leader.id;

           return (
             <div 
                key={leader.id} 
                className={`flex items-center gap-4 p-4 rounded-xl bg-bgSecondary border ${isMe ? 'border-textHighlight shadow-[0_0_15px_rgba(167,139,250,0.15)] transform scale-[1.01]' : 'border-transparent hover:border-borderColor hover:bg-bgHover hover:translate-x-1'} transition-all duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
             >
                <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-black text-lg flex-shrink-0 ${rankClass}`}>
                  {rankIcon}
                  {rank}
                </div>
                
                <img 
                  src={leader.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.full_name || leader.email)}`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full border-2 border-borderColor object-cover"
                />

                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-lg truncate ${isMe ? 'text-textHighlight' : 'text-textPrimary'}`}>
                    {leader.full_name || leader.email.split('@')[0]}
                    {isMe && <span className="ml-2 text-xs bg-textHighlight/10 text-textHighlight px-2 py-0.5 rounded-full border border-textHighlight/20">YOU</span>}
                  </div>
                  <div className="text-textSecondary text-sm font-mono">
                    {leader.total_lessons} lessons completed
                  </div>
                </div>

                <div className="text-right">
                   <div className="text-2xl font-bold font-mono bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                     {leader.total_score}
                   </div>
                   <div className="text-xs text-textSecondary uppercase tracking-wider">points</div>
                </div>
             </div>
           );
         })}
       </div>
    </div>
  );
};

export default LeaderboardTab;