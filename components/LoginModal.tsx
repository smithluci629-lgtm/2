import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    setError(null);
    setMessage(null);
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password.');
      } else {
        setError(loginError.message);
      }
    } else {
      onClose();
    }
  };

  const handleRegister = async () => {
    setError(null);
    setMessage(null);
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    setLoading(false);

    if (signUpError) {
       if (signUpError.message.includes('User already registered')) {
         setError('This email is already registered. Please log in.');
       } else {
         setError(signUpError.message);
       }
    } else if (data.user && !data.session) {
      setMessage('Registration successful! Please check your email to confirm.');
    } else {
       onClose(); // Auto logged in (if Supabase config allows)
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-bgPanel w-full max-w-md rounded-3xl border border-borderColor shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-bgSecondary text-textSecondary hover:bg-bgHover hover:text-textPrimary transition-all"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg shadow-purple-500/20">
            <i className="fas fa-user-circle"></i>
          </div>

          <h2 className="text-2xl font-bold text-textPrimary mb-2">Welcome back</h2>
          <p className="text-textSecondary mb-8 text-sm">Sign in to save progress and compete on the Global Rank</p>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-errorColor text-errorColor p-3 rounded-lg mb-4 text-left text-sm flex items-start gap-2">
              <i className="fas fa-exclamation-circle mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border-l-4 border-accentGreen text-accentGreen p-3 rounded-lg mb-4 text-left text-sm flex items-start gap-2">
              <i className="fas fa-check-circle mt-0.5"></i>
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-textPrimary text-sm font-semibold mb-2">
                <i className="fas fa-envelope mr-2"></i> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-bgSecondary border border-borderColor text-textPrimary rounded-xl px-4 py-3 focus:outline-none focus:border-textHighlight focus:ring-1 focus:ring-textHighlight/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-textPrimary text-sm font-semibold mb-2">
                <i className="fas fa-lock mr-2"></i> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-bgSecondary border border-borderColor text-textPrimary rounded-xl px-4 py-3 focus:outline-none focus:border-textHighlight focus:ring-1 focus:ring-textHighlight/50 transition-all pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt mr-2"></i> Log In</>}
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-user-plus mr-2"></i> Register</>}
            </button>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-textSecondary bg-bgSecondary py-2 px-3 rounded-lg">
             <i className="fas fa-shield-alt"></i> Secure authentication powered by Supabase
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;