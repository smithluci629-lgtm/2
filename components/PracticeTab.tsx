import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { callAIWithRotation, generateLessonPrompt } from '../services/geminiService';
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input when moving to next sentence or starting
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
    if (apiKeys.length === 0) {
      onOpenSettings();
      return;
    }

    setLoading(true);
    try {
      const prompt = generateLessonPrompt(textInput);
      const data = await callAIWithRotation(prompt, apiKeys);

      setStoryData(data.sentences);
      setCurrentIndex(0);
      setPasteMode(false);
      setFeedback({ showed: false, data: null });
      setUserTranslation('');

      if (user) {
        // Create lesson in DB
        const { data: lesson, error } = await supabase
          .from('lessons')
          .insert({
            user_id: user.id,
            vietnamese_text: textInput,
            total_sentences: data.sentences.length,
            completed_sentences: 0,
            score: 0,
            status: 'in_progress'
          })
          .select()
          .single();

        if (lesson) setCurrentLessonId(lesson.id);
        if (error) console.error("Error creating lesson:", error);
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
        is_correct: false, // In a real app we might use AI to fuzzy match correctness
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
      // Finished logic with confetti
      if (window.confetti) {
        window.confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#58cc02', '#2dd4bf', '#a855f7', '#facc15']
        });
      }

      if (user && currentLessonId) {
        const score = storyData.length * 10;
        await supabase.from('lessons').update({
          completed_sentences: storyData.length,
          score: score,
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('id', currentLessonId);

        onUpdateUserStats();
        setTimeout(() => alert(`🎉 CONGRATULATIONS! You earned ${score} points!`), 500);
      } else {
        setTimeout(() => alert("🎉 CONGRATULATIONS! Sign in to save your progress!"), 500);
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
  };

  const speakPhrase = (text: string) => {
    // Google Translate TTS URL (English)
    // client=tw-ob is commonly used for unofficial access, but strict usage policies apply.
    // For a demo/personal project, this usually works.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Audio playback failed:", e));
  };

  return (
    <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
      {/* Input & Story Card */}
      <div className="bg-bgPanel rounded-3xl border-2 border-bgSecondary shadow-card p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-display text-textPrimary flex items-center gap-2">
            <span className="bg-brandHighlight/20 text-brandHighlight p-2 rounded-xl"><i className="fas fa-edit"></i></span>
            Practice
          </h2>
          {!pasteMode && (
            <button onClick={handleNew} className="text-sm px-4 py-2 rounded-xl bg-bgSecondary text-textPrimary font-bold hover:bg-opacity-80 transition-all border-b-4 border-bgBody active:border-b-0 active:translate-y-1">
              <i className="fas fa-plus mr-1"></i> New
            </button>
          )}
        </div>

        {pasteMode ? (
          <div className="animate-fade-in-up">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full h-48 bg-bgBody border-2 border-bgSecondary rounded-2xl p-4 text-textPrimary focus:outline-none focus:border-brandHighlight transition-all mb-6 placeholder-textSecondary/50 text-lg resize-none"
              placeholder="Paste Vietnamese text here..."
            ></textarea>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-brandPrimary text-white font-extrabold text-lg rounded-2xl shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-2 uppercase tracking-wide"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : "Start Lesson"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fade-in-up">
            {/* Story Display */}
            <div className="bg-bgBody rounded-2xl p-6 mb-6 text-lg leading-relaxed min-h-[120px] border-2 border-bgSecondary">
              {storyData.length === 0 ? (
                <div className="text-center text-textSecondary py-8">
                  <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
                  <p>Generating...</p>
                </div>
              ) : (
                storyData.map((sentence, idx) => {
                  let className = "transition-all duration-300 rounded px-1 inline-block mx-0.5 ";
                  let content = sentence.vi;

                  if (idx < currentIndex) {
                    className += "text-textSecondary font-normal line-through opacity-50";
                    content = sentence.vi; // Keep Vietnamese but strikethrough
                  } else if (idx === currentIndex) {
                    className += "text-brandPrimary font-bold bg-brandPrimary/10 border-b-2 border-brandPrimary/30";
                    content = sentence.vi;
                  } else {
                    className += "text-textSecondary opacity-50";
                    content = sentence.vi;
                  }

                  return <span key={idx} className={className}>{content} </span>
                })
              )}
            </div>

            {/* Input Area */}
            <div className="relative mb-6">
              <textarea
                ref={inputRef}
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                disabled={feedback.showed}
                className={`w-full h-32 bg-bgBody border-2 ${feedback.showed ? 'border-bgSecondary text-textSecondary' : 'border-bgSecondary focus:border-brandSecondary'} rounded-2xl p-4 text-textPrimary focus:outline-none transition-all text-lg resize-none`}
                placeholder={feedback.showed ? "" : "Type translation..."}
              ></textarea>

              {feedback.showed && feedback.data && (
                <div className="absolute inset-0 bg-bgPanel/95 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center animate-fade-in border-2 border-brandHighlight/20">
                  <div className="text-sm text-textSecondary uppercase font-bold mb-1">Correct Answer:</div>
                  <div className="text-lg font-bold text-brandHighlight mb-2">{feedback.data.en_best}</div>
                  <button onClick={() => speakPhrase(feedback.data!.en_best)} className="self-start text-textPrimary bg-bgSecondary px-3 py-1 rounded-full text-xs font-bold hover:bg-opacity-80 flex items-center gap-1">
                    <i className="fas fa-volume-up"></i> Listen (Google)
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-auto">
              {!feedback.showed ? (
                <button
                  onClick={checkAnswer}
                  className="flex-1 py-4 rounded-2xl bg-brandSecondary text-white font-extrabold shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all uppercase tracking-wide"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 rounded-2xl bg-brandPrimary text-white font-extrabold shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all uppercase tracking-wide"
                >
                  Continue
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-xs text-textSecondary uppercase font-bold mb-2">
                <span>Progress</span>
                <span>{currentIndex} / {storyData.length}</span>
              </div>
              <div className="h-4 bg-bgBody border-2 border-bgSecondary rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-brandHighlight rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentIndex) / storyData.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Card */}
      {feedback.showed && feedback.data && feedback.data.phrase_breakdown && (
        <div className="bg-bgPanel rounded-3xl border-2 border-bgSecondary shadow-card p-6 animate-slide-in-up">
          <h3 className="text-lg font-bold font-display text-textPrimary mb-4 flex items-center gap-2">
            <i className="fas fa-book-open text-accentYellow"></i> Vocabulary From This Sentence
          </h3>
          <div className="grid gap-2">
            {feedback.data.phrase_breakdown.map((item, i) => (
              <div key={i} className="bg-bgBody p-3 rounded-xl border border-bgSecondary flex justify-between items-center group hover:border-brandSecondary/50 transition-colors cursor-pointer" onClick={() => speakPhrase(item.phrase)}>
                <span className="font-bold text-brandSecondary group-hover:underline">{item.phrase}</span>
                <span className="text-textSecondary text-sm">{item.meaning}</span>
                <i className="fas fa-volume-up text-textSecondary group-hover:text-textPrimary ml-2 text-xs opacity-50"></i>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeTab;