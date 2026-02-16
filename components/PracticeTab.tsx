import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { callAIWithRotation, generateLessonPrompt } from '../services/geminiService';
import { getCachedLesson, cacheLesson } from '../services/cacheService';
import { StoryResponse, SentenceData, Lesson, UserProfile } from '../types';

declare global {
  interface Window {
    confetti: any;
  }
}

interface PracticeTabProps {
  apiKeys: string[];
  user: UserProfile | null;
  onOpenSettings: () => void;
  onUpdateUserStats: () => void;
}

const PracticeTab: React.FC<PracticeTabProps> = ({ apiKeys, user, onOpenSettings, onUpdateUserStats }) => {
  const [pasteMode, setPasteMode] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyData, setStoryData] = useState<SentenceData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [feedback, setFeedback] = useState<{ showed: boolean; data: SentenceData | null }>({ showed: false, data: null });
  const [fromCache, setFromCache] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!pasteMode && !feedback.showed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pasteMode, feedback.showed, currentIndex]);

  const handleGenerate = async () => {
    if (!textInput.trim()) {
      alert("Please paste some Vietnamese text first!");
      return;
    }

    const cached = getCachedLesson(textInput);
    if (cached) {
      setStoryData(cached.sentences);
      setCurrentIndex(0);
      setPasteMode(false);
      setFeedback({ showed: false, data: null });
      setUserTranslation('');
      setFromCache(true);
      return;
    }

    if (apiKeys.length === 0) {
      onOpenSettings();
      return;
    }

    setLoading(true);
    setFromCache(false);
    try {
      const prompt = generateLessonPrompt(textInput);
      const data = await callAIWithRotation(prompt, apiKeys);
      cacheLesson(textInput, data);

      setStoryData(data.sentences);
      setCurrentIndex(0);
      setPasteMode(false);
      setFeedback({ showed: false, data: null });
      setUserTranslation('');

      if (user) {
        const { data: lesson } = await supabase.from('lessons').insert({
          user_id: user.id,
          vietnamese_text: textInput,
          total_sentences: data.sentences.length,
          completed_sentences: 0,
          score: 0,
          status: 'in_progress'
        }).select().single();
        if (lesson) setCurrentLessonId(lesson.id);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    const currentSentence = storyData[currentIndex];
    setFeedback({ showed: true, data: currentSentence });

    if (user && currentLessonId) {
      await supabase.from('lesson_attempts').insert({
        lesson_id: currentLessonId,
        user_id: user.id,
        sentence_index: currentIndex,
        vietnamese_sentence: currentSentence.vi,
        correct_answer: currentSentence.en_best,
        user_answer: userTranslation,
        is_correct: false,
        attempts: 1
      });
    }
  };

  const handleNext = async () => {
    if (currentIndex < storyData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFeedback({ showed: false, data: null });
      setUserTranslation('');
    } else {
      if (window.confetti) {
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899', '#06b6d4'] });
      }
      if (user && currentLessonId) {
        const score = storyData.length * 10;
        await supabase.from('lessons').update({ completed_sentences: storyData.length, score: score, status: 'completed', completed_at: new Date().toISOString() }).eq('id', currentLessonId);
        onUpdateUserStats();
        setTimeout(() => alert(`🎉 Mission Complete! +${score} XP`), 500);
      } else {
        setTimeout(() => alert("🎉 Mission Complete! Login to save stats."), 500);
      }
    }
  };

  const handleRetry = () => {
    setFeedback({ showed: false, data: null });
    setUserTranslation('');
    inputRef.current?.focus();
  };

  const handleNew = () => {
    setPasteMode(true);
    setStoryData([]);
    setCurrentIndex(0);
    setTextInput('');
    setFromCache(false);
  };

  const speakPhrase = (text: string) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const audio = new Audio(url);
    audio.play().catch(console.error);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-start">

      {/* Left Panel: Workflow */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden group">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-neonPurple/20 rounded-full blur-3xl group-hover:bg-neonPurple/30 transition-all duration-700"></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold font-sans text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
              <i className="fas fa-terminal text-neonBlue"></i>
            </div>
            <span>Input Terminal</span>
            {fromCache && <span className="text-[10px] bg-neonGreen/10 text-neonGreen border border-neonGreen/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">Cached</span>}
          </h2>
          {!pasteMode && (
            <button onClick={handleNew} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-textSecondary hover:text-white transition-all">
              Reset
            </button>
          )}
        </div>

        {pasteMode ? (
          <div className="animate-fade-scale">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full h-48 glass-input rounded-xl p-5 text-lg font-medium placeholder-white/30 resize-none mb-6 font-mono leading-relaxed focus:outline-none"
              placeholder="// Paste Vietnamese text source here..."
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-xl btn-neon text-white font-bold text-lg tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-code-branch"></i> Initialize Sequence</>}
            </button>
          </div>
        ) : (
          <div className="animate-fade-scale">
            <div className="mb-6 p-5 rounded-2xl bg-black/20 border border-white/5 font-medium text-lg leading-relaxed relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-neonPurple rounded-l-2xl"></div>
              {storyData.length === 0 ? (
                <div className="flex items-center gap-2 text-neonBlue animate-pulse">
                  <i className="fas fa-cog fa-spin"></i> Processing data...
                </div>
              ) : (
                storyData.map((s, i) => (
                  <span key={i} className={`mr-1 transition-all duration-300 ${i === currentIndex ? 'text-white bg-neonPurple/20 box-decoration-clone px-1 rounded' : i < currentIndex ? 'text-textSecondary line-through opacity-40' : 'text-textSecondary opacity-60'}`}>
                    {s.vi}
                  </span>
                ))
              )}
            </div>

            <div className="relative group">
              <textarea
                ref={inputRef}
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                disabled={feedback.showed}
                className={`w-full h-32 glass-input rounded-xl p-5 text-xl font-medium focus:outline-none transition-all resize-none ${feedback.showed ? 'opacity-50 blur-[1px]' : ''}`}
                placeholder="Type translation..."
              />
              {feedback.showed && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className={`text-6xl ${feedback.data?.en_best === userTranslation ? 'text-neonGreen' : 'text-neonPink'} drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                    <i className={`fas ${feedback.data?.en_best === userTranslation ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              {!feedback.showed ? (
                <button onClick={checkAnswer} className="flex-1 py-4 rounded-xl bg-white text-bgBody font-bold text-lg hover:bg-neonBlue hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  Verify Output
                </button>
              ) : (
                <>
                  <button onClick={handleRetry} className="px-6 py-4 rounded-xl glass-button text-white font-bold hover:bg-white/10">
                    <i className="fas fa-undo"></i>
                  </button>
                  <button onClick={handleNext} className="flex-1 py-4 rounded-xl btn-neon text-white font-bold text-lg">
                    Proceed <i className="fas fa-arrow-right ml-2 opacity-70"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Data Visualization (Feedback) */}
      <div className={`glass-card rounded-3xl p-8 relative min-h-[400px] flex flex-col transition-all duration-500 ${feedback.showed ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-10 blur-sm pointer-events-none lg:opacity-100 lg:blur-0 lg:translate-x-0 lg:grayscale'}`}>

        <div className="flex items-center gap-2 mb-6 text-neonCyan font-bold tracking-wider uppercase text-xs border-b border-white/10 pb-4">
          <i className="fas fa-database"></i> Analysis Stream
        </div>

        {!feedback.showed || !feedback.data ? (
          <div className="flex-1 flex flex-col items-center justify-center text-textSecondary space-y-4 opacity-50">
            <div className="w-20 h-20 rounded-full border border-dashed border-white/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
              <div className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center animate-[spin_5s_linear_infinite_reverse]"></div>
            </div>
            <p className="font-mono text-sm">Waiting for input...</p>
          </div>
        ) : (
          <div className="animate-fade-scale space-y-6">
            <div>
              <div className="text-xs text-textSecondary uppercase font-bold mb-2">Optimal Translation</div>
              <div className="text-xl md:text-2xl font-bold text-white leading-relaxed p-4 rounded-xl bg-gradient-to-r from-neonGreen/10 to-transparent border-l-4 border-neonGreen shadow-[0_4px_20px_rgba(16,185,129,0.1)] flex justify-between gap-4">
                <span>{feedback.data.en_best}</span>
                <button onClick={() => speakPhrase(feedback.data!.en_best)} className="text-neonGreen hover:text-white transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-neonGreen/20">
                  <i className="fas fa-volume-up"></i>
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-textSecondary uppercase font-bold mb-2 mt-8">Vocabulary Matrix</div>
              <div className="grid gap-3">
                {feedback.data.phrase_breakdown?.map((item, i) => (
                  <div key={i} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neonPurple/50 hover:bg-neonPurple/10 transition-all cursor-pointer flex justify-between items-center" onClick={() => speakPhrase(item.phrase)}>
                    <div>
                      <div className="text-neonBlue font-bold text-lg group-hover:text-neonPurple transition-colors">{item.phrase}</div>
                      <div className="text-sm text-textSecondary">{item.meaning}</div>
                    </div>
                    <i className="fas fa-play text-xs text-white/20 group-hover:text-neonPurple transition-colors"></i>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PracticeTab;