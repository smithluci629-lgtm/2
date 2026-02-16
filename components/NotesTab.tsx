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
      <div className="max-w-2xl mx-auto text-center py-20 px-6 bg-bgPanel rounded-xl border border-borderColor shadow-lg">
        <i className="fas fa-lock text-6xl mb-6 text-textSecondary/30 block"></i>
        <h3 className="text-2xl font-bold text-textPrimary mb-3">Login Required</h3>
        <p className="text-textSecondary mb-8">Please sign in to access your personal notes.</p>
        <button onClick={onOpenLogin} className="btn-primary py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/30 transition-all">
          <i className="fas fa-sign-in-alt mr-2"></i> Open Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {view === 'list' ? (
        <div className="bg-bgPanel rounded-xl border border-borderColor shadow-lg p-6 animate-fade-in-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
              <i className="fas fa-sticky-note text-textHighlight"></i> My Notes
            </h2>
            <button onClick={handleCreate} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2">
              <i className="fas fa-plus"></i> New Note
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-2xl text-textSecondary"></i></div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 text-textSecondary bg-bgSecondary/30 rounded-xl border border-dashed border-borderColor">
              <i className="fas fa-book-open text-4xl mb-4 opacity-30 block"></i>
              <h3 className="text-lg font-medium text-textPrimary">No notes yet</h3>
              <p>Create your first note to start tracking vocabulary!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => handleEdit(note)}
                  className="group relative bg-bgSecondary p-5 rounded-xl border-l-4 border-textHighlight hover:bg-bgHover transition-all cursor-pointer shadow-sm hover:translate-x-1 duration-300"
                >
                  <div className="flex justify-between items-start pr-8">
                    <h3 className="font-semibold text-textPrimary text-lg mb-1 line-clamp-1">{note.title || "Untitled"}</h3>
                    <div className="text-xs text-textSecondary font-mono mt-1">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-textSecondary text-sm line-clamp-2">
                    {note.note_content || "No content"}
                  </p>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteId(note.id); }}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-bgPanel text-textSecondary border border-borderColor opacity-0 group-hover:opacity-100 hover:text-errorColor hover:border-errorColor transition-all"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bgPanel rounded-xl border border-borderColor shadow-lg p-6 animate-slide-in">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
               <i className="fas fa-edit text-textHighlight"></i> {currentNote.id ? 'Edit Note' : 'New Note'}
             </h2>
             <button onClick={() => setView('list')} className="text-textSecondary hover:text-textPrimary bg-bgSecondary py-2 px-4 rounded-xl border border-borderColor transition-all text-sm flex items-center gap-2">
               <i className="fas fa-arrow-left"></i> Back
             </button>
           </div>

           <div className="space-y-4">
             <input 
                type="text" 
                value={currentNote.title || ''}
                onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
                maxLength={100}
                placeholder="Note Title..."
                className="w-full bg-bgSecondary border-2 border-borderColor text-textPrimary text-lg font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-textHighlight focus:ring-1 focus:ring-textHighlight/30 transition-all"
             />

             <div className="relative">
                <div className="flex justify-between text-xs text-textSecondary px-2 mb-1">
                   <span><i className="fas fa-info-circle mr-1"></i> Supports Markdown</span>
                   <span className={`font-mono ${(currentNote.note_content?.length || 0) > 1800 ? 'text-errorColor' : ''}`}>
                     {currentNote.note_content?.length || 0} / 2000
                   </span>
                </div>
                <textarea 
                  value={currentNote.note_content || ''}
                  onChange={(e) => setCurrentNote({...currentNote, note_content: e.target.value})}
                  maxLength={2000}
                  placeholder="Write your note here..."
                  className="w-full h-96 bg-bgSecondary border-2 border-borderColor text-textPrimary rounded-xl p-5 text-base leading-relaxed resize-y focus:outline-none focus:border-textHighlight focus:ring-1 focus:ring-textHighlight/30 transition-all font-sans"
                ></textarea>
             </div>

             <div className="flex gap-3 pt-2">
               <button onClick={handleSave} className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                 <i className="fas fa-save"></i> Save Note
               </button>
               <button onClick={() => setView('list')} className="w-32 py-3 bg-bgSecondary text-textPrimary border border-borderColor rounded-xl hover:bg-bgHover transition-all">
                 Cancel
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-bgPanel w-full max-w-sm rounded-2xl border border-borderColor shadow-2xl p-6 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-errorColor flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-bold text-textPrimary mb-2">Delete Note?</h3>
            <p className="text-textSecondary mb-6 text-sm">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3">
               <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-bgSecondary border border-borderColor text-textPrimary hover:bg-bgHover">Cancel</button>
               <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-errorColor text-white hover:bg-red-600 shadow-lg shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;