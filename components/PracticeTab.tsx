import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { callAIWithRotation, generateLessonPrompt } from '../services/geminiService';
import { StoryResponse, SentenceData, Lesson, UserProfile } from '../types';

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
      // Finished
      if (user && currentLessonId) {
        const score = storyData.length * 10;
        await supabase.from('lessons').update({
          completed_sentences: storyData.length,
          score: score,
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('id', currentLessonId);

        onUpdateUserStats();
        alert(`🎉 CONGRATULATIONS! You earned ${score} points!`);
      } else {
        alert("🎉 CONGRATULATIONS! Sign in to save your progress!");
      }
      // Reset or stay? Let's stay but maybe show full completion state
      // For now, just clear feedback to look like "done"
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
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const audio = new Audio(url);
    audio.play().catch(e => console.error(e));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 max-w-6xl mx-auto">
      {/* Left Column: Input & Story */}
      <div className="bg-bgPanel rounded-xl border border-borderColor shadow-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-semibold text-textPrimary flex items-center gap-2">
             <i className="fas fa-edit text-textHighlight"></i> Practice Area
           </h2>
           {!pasteMode && (
             <button onClick={handleNew} className="btn-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
               <i className="fas fa-plus"></i> New
             </button>
           )}
        </div>

        {pasteMode ? (
          <div className="animate-fade-in-up">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full h-40 bg-bgSecondary border border-borderColor rounded-xl p-4 text-textPrimary focus:outline-none focus:border-textHighlight focus:ring-1 focus:ring-textHighlight/30 transition-all mb-4"
              placeholder="📝 Paste Vietnamese text here to start learning..."
            ></textarea>
            <button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-magic"></i> Generate Lesson</>}
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fade-in-up">
            {/* Story Display */}
            <div className="bg-bgSecondary rounded-xl p-5 mb-5 text-lg leading-relaxed min-h-[120px] shadow-inner border border-borderColor/50">
              {storyData.length === 0 ? (
                 <div className="text-center text-textSecondary py-8">
                   <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
                   <p>Generating...</p>
                 </div>
              ) : (
                storyData.map((sentence, idx) => {
                  let className = "transition-all duration-300 rounded px-1 ";
                  let content = sentence.vi;

                  if (idx < currentIndex) {
                    className += "text-textSecondary font-normal";
                    content = sentence.en_best;
                  } else if (idx === currentIndex) {
                    className += "text-[#ff6b9d] font-bold bg-pink-500/10";
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
            <textarea
              ref={inputRef}
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              disabled={feedback.showed}
              className={`w-full h-32 bg-bgSecondary border-2 ${feedback.showed ? 'border-borderColor opacity-80' : 'border-accentYellow shadow-[0_0_0_2px_rgba(245,158,11,0.1)]'} rounded-xl p-4 text-textPrimary focus:outline-none transition-all mb-4 text-base`}
              placeholder={feedback.showed ? "" : "Enter your English translation here..."}
            ></textarea>

            {/* Controls */}
            <div className="flex gap-3 mt-auto flex-wrap">
               {!feedback.showed ? (
                 <>
                   <button 
                      onClick={() => currentIndex > 0 && setCurrentIndex(curr => curr - 1)}
                      disabled={currentIndex === 0}
                      className={`flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'bg-bgSecondary text-textPrimary hover:bg-bgHover border border-borderColor'}`}
                   >
                     <i className="fas fa-arrow-left"></i> Prev
                   </button>
                   <button 
                      onClick={checkAnswer}
                      className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 hover:text-white hover:-translate-y-0.5 shadow-lg border border-gray-600 font-semibold flex items-center justify-center gap-2"
                   >
                     <i className="fas fa-check-circle text-accentGreen"></i> Check Answer
                   </button>
                 </>
               ) : (
                 <>
                   <button onClick={handleRetry} className="flex-1 py-2.5 rounded-xl bg-bgSecondary text-textPrimary hover:bg-bgHover border border-borderColor font-semibold flex items-center justify-center gap-2">
                     <i className="fas fa-redo"></i> Retry
                   </button>
                   <button 
                     onClick={handleNext} 
                     className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-lg hover:-translate-y-0.5 border border-gray-500 font-semibold flex items-center justify-center gap-2"
                   >
                     <i className="fas fa-arrow-right"></i> Continue
                   </button>
                 </>
               )}
            </div>

            {/* Progress */}
            <div className="mt-6 pt-5 border-t border-borderColor">
              <div className="flex justify-between text-sm text-textSecondary mb-2 font-mono">
                <span>Step <span className="text-textPrimary font-bold">{currentIndex + 1}</span> of {storyData.length}</span>
              </div>
              <div className="h-3 bg-bgPanel border border-borderColor rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${((currentIndex) / storyData.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Feedback */}
      <div className="bg-bgPanel rounded-xl border border-borderColor shadow-lg p-6 h-fit">
        <h2 className="text-xl font-semibold text-textPrimary flex items-center gap-2 mb-4">
           <i className="fas fa-comments text-accentBlue"></i> Feedback
        </h2>

        {!feedback.showed || !feedback.data ? (
          <div className="text-center py-10 text-textSecondary bg-bgSecondary/50 rounded-xl border border-borderColor border-dashed">
             <i className="fas fa-lightbulb text-4xl mb-3 opacity-30 block"></i>
             <h3 className="text-lg font-medium text-textPrimary mb-1">Check your answer</h3>
             <p className="text-sm">Submit your translation to see feedback</p>
          </div>
        ) : (
          <div className="animate-slide-in">
             <div className="mb-4">
                <div className="text-textHighlight font-bold mb-2 flex items-center gap-2">
                  <i className="fas fa-check-circle"></i> Best Answer:
                </div>
                <div className="bg-bgSecondary p-4 rounded-xl border-l-4 border-accentGreen shadow-sm">
                   <div className="text-accentGreen text-lg font-semibold flex justify-between items-start gap-2">
                     <span>{feedback.data.en_best}</span>
                     <button onClick={() => speakPhrase(feedback.data!.en_best)} className="text-textSecondary hover:text-textPrimary text-sm mt-1">
                       <i className="fas fa-volume-up"></i>
                     </button>
                   </div>
                </div>
             </div>

             <div>
                <div className="text-textHighlight font-bold mb-2 flex items-center gap-2">
                   <i className="fas fa-book"></i> Vocabulary:
                </div>
                <div className="bg-bgSecondary rounded-xl overflow-hidden shadow-sm">
                   {feedback.data.phrase_breakdown?.map((item, i) => (
                     <div key={i} className="p-3 border-b border-borderColor last:border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-bgHover/50 transition-colors">
                        <div className="font-medium">
                          <span className="text-accentGreen font-semibold mr-1 cursor-pointer hover:underline" onClick={() => speakPhrase(item.phrase)}>{item.phrase}</span>
                          <span className="text-textSecondary text-sm hidden sm:inline">:</span>
                        </div>
                        <span className="text-[#c4b5fd] text-sm sm:text-right">{item.meaning}</span>
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