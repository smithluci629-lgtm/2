import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Note } from '../types';

interface NotesTabProps {
  user: UserProfile | null;
  onOpenLogin: () => void;
}

const NotesTab: React.FC<NotesTabProps> = ({ user, onOpenLogin }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (data) setNotes(data as Note[]);
    setLoading(false);
  };

  const handleCreate = () => {
    setCurrentNote({ title: '', note_content: '' });
    setView('editor');
  };

  const handleEdit = (note: Note) => {
    setCurrentNote(note);
    setView('editor');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!currentNote.title?.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      if (currentNote.id) {
        await supabase.from('user_notes').update({
          title: currentNote.title,
          note_content: currentNote.note_content,
          updated_at: new Date().toISOString()
        }).eq('id', currentNote.id);
      } else {
        await supabase.from('user_notes').insert({
          user_id: user.id,
          title: currentNote.title,
          note_content: currentNote.note_content
        });
      }
      setView('list');
      loadNotes();
    } catch (error: any) {
      alert("Error saving note: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('user_notes').delete().eq('id', deleteId);
    setDeleteId(null);
    loadNotes();
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-10 px-6 glass-card rounded-3xl mt-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neonPink/20 blur-[50px]"></div>
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 relative z-10">
          <i className="fas fa-lock text-3xl text-neonPink"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Encrypted Notes</h3>
        <p className="text-textSecondary mb-8 text-sm relative z-10">Secure access requires authentication.</p>
        <button onClick={onOpenLogin} className="w-full py-4 rounded-xl btn-neon text-white font-bold relative z-10 uppercase tracking-widest text-sm">
          Authenticate
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full pb-20">
      {view === 'list' ? (
        <div className="animate-fade-scale">
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="p-3 glass rounded-2xl border border-neonBlue/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <i className="fas fa-bolt text-xl text-neonBlue"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Flash Notes</h2>
                <p className="text-xs text-textSecondary uppercase tracking-widest font-bold">Personal Knowledge Base</p>
              </div>
            </div>
            <button onClick={handleCreate} className="px-4 py-2 rounded-xl glass-button text-white font-bold text-sm flex items-center gap-2 hover:bg-neonBlue/20 hover:border-neonBlue/50 transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <i className="fas fa-plus"></i> Create
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-2xl text-neonBlue"></i></div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 text-textSecondary glass-panel rounded-3xl border-dashed border-2 border-white/10">
              <i className="fas fa-terminal text-4xl mb-4 opacity-30 block"></i>
              <h3 className="text-lg font-bold text-white">Empty Buffer</h3>
              <p>Initialize your first note entry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleEdit(note)}
                  className="group relative glass-panel p-5 rounded-2xl cursor-pointer hover:border-neonPurple/50 hover:bg-white/10 hover:translate-y-[-2px] transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-neonPurple transition-colors">{note.title || "Untitled"}</h3>
                    <div className="text-[10px] text-textSecondary font-mono bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-textSecondary text-sm line-clamp-2 h-10 leading-relaxed opacity-80 font-mono">
                    {note.note_content || "No content"}
                  </p>

                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(note.id); }}
                    className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 animate-fade-scale min-h-[500px] flex flex-col relative overflow-hidden">
          {/* Editor Mode */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonBlue via-neonPurple to-neonPink"></div>

          <div className="flex justify-between items-center mb-6 z-10">
            <button onClick={() => setView('list')} className="w-10 h-10 rounded-xl glass-button text-textSecondary hover:text-white flex items-center justify-center transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
            <h2 className="text-sm font-bold text-textSecondary uppercase tracking-widest">
              {currentNote.id ? 'Edit Entry' : 'New Entry'}
            </h2>
            <button onClick={handleSave} className="px-6 py-2 rounded-xl btn-neon text-white font-bold text-sm shadow-lg hover:shadow-neonPurple/50 transition-all flex items-center gap-2">
              <i className="fas fa-save"></i> Save
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 z-10">
            <input
              type="text"
              value={currentNote.title || ''}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
              maxLength={100}
              placeholder="Entry Title..."
              className="w-full bg-transparent border-b border-white/10 text-white text-2xl font-bold px-2 py-4 focus:outline-none focus:border-neonPurple transition-all placeholder-white/20"
            />

            <textarea
              value={currentNote.note_content || ''}
              onChange={(e) => setCurrentNote({ ...currentNote, note_content: e.target.value })}
              maxLength={2000}
              placeholder="Input data stream..."
              className="flex-1 w-full glass-input rounded-2xl p-6 text-textPrimary text-base leading-relaxed resize-none focus:outline-none focus:border-neonPurple/50 transition-all font-mono"
            ></textarea>

            <div className="flex justify-end">
              <span className="text-xs text-textSecondary font-mono bg-black/30 px-2 py-1 rounded">
                {currentNote.note_content?.length || 0} / 2000 CHARS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-xs rounded-2xl p-8 text-center animate-scale-in border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4 animate-pulse"></i>
            <h3 className="text-xl font-bold text-white mb-2">Delete Entry?</h3>
            <p className="text-textSecondary mb-8 text-xs font-mono">Data cannot be recovered.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl glass-button text-white font-bold hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500/80 text-white font-bold hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;