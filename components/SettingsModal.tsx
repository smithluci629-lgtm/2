import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: string[]) => void;
  initialKeys: string[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialKeys }) => {
  const [keys, setKeys] = useState<string[]>(initialKeys.length > 0 ? initialKeys : ['']);

  useEffect(() => {
    if (isOpen) {
      setKeys(initialKeys.length > 0 ? initialKeys : ['']);
    }
  }, [isOpen, initialKeys]);

  const handleAddSlot = () => {
    setKeys([...keys, '']);
  };

  const handleRemoveSlot = (index: number) => {
    const newKeys = keys.filter((_, i) => i !== index);
    setKeys(newKeys);
  };

  const handleChange = (index: number, value: string) => {
    const newKeys = [...keys];
    newKeys[index] = value;
    setKeys(newKeys);
  };

  const handleSave = () => {
    const validKeys = keys.map(k => k.trim()).filter(k => k !== '');
    if (validKeys.length === 0) {
      alert("⚠️ Please add at least one API key!");
      return;
    }
    onSave(validKeys);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-bgPanel w-full max-w-lg rounded-2xl border border-borderColor shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-textPrimary flex items-center gap-3">
              <i className="fas fa-cog text-textHighlight"></i> API Settings
            </h2>
            <button onClick={onClose} className="text-textSecondary hover:text-textPrimary transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <p className="text-textSecondary mb-6 text-sm">
            Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-textHighlight hover:underline">Google AI Studio</a>.
            You can add multiple keys for rotation.
          </p>

          <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
            {keys.map((key, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleChange(index, e.target.value)}
                    placeholder="Paste your Gemini API key here..."
                    className="w-full bg-bgSecondary border border-borderColor text-textPrimary text-sm font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-textHighlight focus:ring-1 focus:ring-textHighlight/50 transition-all placeholder-textSecondary/50 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-textSecondary font-mono">#{index + 1}</span>
                </div>
                {keys.length > 1 && (
                  <button 
                    onClick={() => handleRemoveSlot(index)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/10 text-errorColor hover:bg-red-500 hover:text-white transition-all"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={handleAddSlot}
            className="w-full mb-3 py-3 rounded-xl border border-borderColor text-textPrimary hover:bg-bgHover transition-all font-semibold flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus"></i> Add Another Key
          </button>

          <button 
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-save"></i> Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;