import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    if (!email || !password) return "Please enter both email and password.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);

    if (isRegister) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('This email is already registered. Please log in.');
        } else {
          setError(signUpError.message);
        }
      } else if (data.user && !data.session) {
        setMessage('Account created! Check your email to confirm.');
      } else {
        onClose();
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password.');
        } else {
          setError(loginError.message);
        }
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-3xl relative overflow-hidden animate-scale-in border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.3)]">
        {/* Background Gradients */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-neonBlue/20 rounded-full blur-[60px] animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-neonPurple/20 rounded-full blur-[60px] animate-pulse delay-1000"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-all z-20"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="p-8 pt-12 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neonBlue to-neonPurple flex items-center justify-center mx-auto mb-6 shadow-lg shadow-neonPurple/30">
            <i className="fas fa-fingerprint text-3xl text-white"></i>
          </div>

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            {isRegister ? "Join Network" : "Welcome Back"}
          </h2>
          <p className="text-textSecondary mb-8 text-sm font-medium">
            {isRegister ? "Initialize new user protocol" : "Authenticate to sync neural data"}
          </p>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-left text-xs font-bold flex items-center gap-2 border border-red-500/20 animate-shake">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-neonGreen/10 text-neonGreen p-3 rounded-xl mb-4 text-left text-xs font-bold flex items-center gap-2 border border-neonGreen/20">
              <i className="fas fa-check-circle"></i>
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-4 text-left">
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Identity"
                className="w-full glass-input rounded-xl px-4 py-4 pl-12 text-white font-bold focus:border-neonBlue transition-all placeholder-white/20"
              />
              <i className="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-neonBlue transition-colors"></i>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passcode"
                className="w-full glass-input rounded-xl px-4 py-4 pl-12 text-white font-bold focus:border-neonPurple transition-all placeholder-white/20 pr-10"
              />
              <i className="fas fa-asterisk absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-neonPurple transition-colors text-xs"></i>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 py-4 rounded-xl btn-neon text-white font-black shadow-lg hover:shadow-neonPurple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-sm"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : (isRegister ? "Initialize" : "Connect")}
          </button>

          <div className="mt-8 text-sm font-medium text-textSecondary">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(null); setMessage(null); }}
              className="text-white hover:text-neonBlue transition-colors relative group"
            >
              {isRegister ? "Access existing account" : "Create new identity"}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neonBlue transition-all group-hover:w-full"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;