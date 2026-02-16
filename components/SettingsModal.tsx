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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-2xl relative overflow-hidden animate-scale-in border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neonPurple/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-neonBlue/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-8 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
              <i className="fas fa-cog text-neonPurple animate-spin-slow"></i> System Config
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-textSecondary hover:bg-white/10 hover:text-white transition-all">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-neonBlue/5 border border-neonBlue/20">
            <p className="text-textSecondary text-xs leading-relaxed">
              Connect your neural link via <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-neonBlue font-bold hover:underline hover:text-neonCyan">Google AI Studio</a>.
              Mutliple keys supported for improved throughput.
            </p>
          </div>

          <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {keys.map((key, index) => (
              <div key={index} className="flex gap-2 items-center group">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleChange(index, e.target.value)}
                    placeholder="ENTER_API_KEY_SEQUENCE"
                    className="w-full glass-input rounded-xl px-4 py-3 pl-10 text-sm font-mono text-neonGreen focus:border-neonGreen/50 placeholder-white/10 transition-all"
                  />
                  <i className="fas fa-key absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neonGreen transition-colors"></i>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-mono">SLOT_{index + 1}</span>
                </div>
                {keys.length > 1 && (
                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-transparent hover:border-red-400/50"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <button
              onClick={handleAddSlot}
              className="w-full py-3 rounded-xl glass-button text-textSecondary hover:text-white font-semibold flex items-center justify-center gap-2 text-sm border-dashed"
            >
              <i className="fas fa-plus"></i> Initialize New Slot
            </button>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-xl btn-neon text-white font-bold shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm hover:shadow-neonPurple/50"
            >
              <i className="fas fa-save"></i> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;