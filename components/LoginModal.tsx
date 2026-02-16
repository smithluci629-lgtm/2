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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-bgPanel w-full max-w-sm rounded-[2rem] border-2 border-bgSecondary shadow-2xl relative overflow-hidden animate-scale-in">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bgBody text-textSecondary hover:bg-bgSecondary hover:text-textPrimary transition-all"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="p-8 pt-10 text-center">
          <h2 className="text-3xl font-extrabold text-textPrimary mb-2 font-display">
            {isRegister ? "Join Loen" : "Welcome Back"}
          </h2>
          <p className="text-textSecondary mb-8 font-medium">
            {isRegister ? "Create an account to track your progress" : "Login to sync your data"}
          </p>

          {error && (
            <div className="bg-accentRed/10 text-accentRed p-3 rounded-xl mb-4 text-left text-xs font-bold flex items-start gap-2 border border-accentRed/20">
              <i className="fas fa-exclamation-circle text-lg"></i>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-brandSecondary/10 text-brandSecondary p-3 rounded-xl mb-4 text-left text-xs font-bold flex items-start gap-2 border border-brandSecondary/20">
              <i className="fas fa-check-circle text-lg"></i>
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-4 text-left">
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-bgBody border-2 border-bgSecondary text-textPrimary rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-brandHighlight transition-all placeholder-textSecondary/50 font-bold"
              />
              <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary group-focus-within:text-brandHighlight transition-colors"></i>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-bgBody border-2 border-bgSecondary text-textPrimary rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-brandHighlight transition-all placeholder-textSecondary/50 font-bold pr-10"
              />
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary group-focus-within:text-brandHighlight transition-colors"></i>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-2xl bg-brandPrimary text-white font-extrabold shadow-button hover:shadow-button-hover active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 uppercase tracking-wide"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isRegister ? "Create Account" : "Log In")}
          </button>

          <div className="mt-6 text-sm font-bold text-textSecondary">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(null); setMessage(null); }}
              className="ml-2 text-brandHighlight hover:underline relative z-10"
            >
              {isRegister ? "Log In" : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;