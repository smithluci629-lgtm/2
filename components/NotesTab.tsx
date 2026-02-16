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
    if (user) {
      loadNotes();
    }
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
        // Update
        await supabase
          .from('user_notes')
          .update({
            title: currentNote.title,
            note_content: currentNote.note_content,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentNote.id);
      } else {
        // Insert
        await supabase
          .from('user_notes')
          .insert({
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
      <div className="max-w-md mx-auto text-center py-10 px-6 bg-bgPanel rounded-3xl border-2 border-bgSecondary shadow-card mt-10">
        <div className="w-20 h-20 bg-bgBody rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-bgSecondary">
          <i className="fas fa-lock text-3xl text-textSecondary"></i>
        </div>
        <h3 className="text-2xl font-bold text-textPrimary mb-3 font-display">Login to Notes</h3>
        <p className="text-textSecondary mb-8 text-sm">Sign in to sync your notes across devices</p>
        <button onClick={onOpenLogin} className="w-full py-4 rounded-2xl bg-brandPrimary text-white font-extrabold shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all uppercase tracking-wide">
          Login Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full">
      {view === 'list' ? (
        <div className="animate-fade-in-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-textPrimary font-display flex items-center gap-2">
              <span className="bg-brandHighlight/20 text-brandHighlight p-2 rounded-xl"><i className="fas fa-columns"></i></span>
              My Notes
            </h2>
            <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-bgSecondary text-textPrimary font-bold hover:bg-opacity-80 transition-all border-b-4 border-bgBody active:border-b-0 active:translate-y-1 text-sm">
              <i className="fas fa-plus mr-1"></i> New
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-2xl text-textSecondary"></i></div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 text-textSecondary bg-bgPanel rounded-3xl border-2 border-bgSecondary border-dashed">
              <i className="fas fa-pencil-alt text-4xl mb-4 opacity-30 block"></i>
              <h3 className="text-lg font-bold text-textPrimary">Empty Notebook</h3>
              <p>Write down new words you learn!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleEdit(note)}
                  className="group relative bg-bgPanel p-5 rounded-2xl border-2 border-bgSecondary hover:border-brandHighlight/50 cursor-pointer shadow-sm hover:translate-y-[-2px] transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-textPrimary text-lg line-clamp-1">{note.title || "Untitled"}</h3>
                    <div className="text-xs text-textSecondary font-mono bg-bgBody px-2 py-1 rounded-lg">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-textSecondary text-sm line-clamp-2 h-10 leading-relaxed opacity-80">
                    {note.note_content || "No content"}
                  </p>

                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(note.id); }}
                    className="absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-bgBody text-textSecondary hover:text-accentRed hover:bg-accentRed/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bgPanel rounded-3xl border-2 border-bgSecondary shadow-card p-4 animate-slide-in h-[calc(100vh-140px)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setView('list')} className="w-10 h-10 rounded-xl bg-bgBody text-textSecondary hover:text-textPrimary flex items-center justify-center transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
            <h2 className="text-lg font-bold text-textPrimary font-display">
              {currentNote.id ? 'Edit Note' : 'New Note'}
            </h2>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-brandPrimary text-white font-bold shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all text-sm">
              Save
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <input
              type="text"
              value={currentNote.title || ''}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
              maxLength={100}
              placeholder="Title..."
              className="w-full bg-transparent border-b-2 border-bgSecondary text-textPrimary text-xl font-bold px-2 py-2 focus:outline-none focus:border-brandHighlight transition-all placeholder-textSecondary/30"
            />

            <textarea
              value={currentNote.note_content || ''}
              onChange={(e) => setCurrentNote({ ...currentNote, note_content: e.target.value })}
              maxLength={2000}
              placeholder="Write something..."
              className="flex-1 w-full bg-bgBody rounded-2xl p-4 text-textPrimary text-base leading-relaxed resize-none focus:outline-none border-2 border-transparent focus:border-bgSecondary transition-all"
            ></textarea>

            <div className="text-right text-xs text-textSecondary font-mono px-2">
              {currentNote.note_content?.length || 0} / 2000
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bgPanel w-full max-w-xs rounded-2xl border-2 border-bgSecondary shadow-2xl p-6 text-center animate-scale-in">
            <h3 className="text-xl font-bold text-textPrimary mb-2 font-display">Delete Note?</h3>
            <p className="text-textSecondary mb-6 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-bgBody text-textPrimary font-bold hover:bg-bgSecondary transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-accentRed text-white font-bold hover:shadow-lg transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;