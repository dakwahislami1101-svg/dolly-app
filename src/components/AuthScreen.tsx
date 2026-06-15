/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Compass, 
  Loader2, 
  ArrowRight,
  UserCheck2,
  Check,
  AlertCircle
} from 'lucide-react';
import { signUpWithEmail, logInWithEmail, db, logInWithGoogle } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthScreenProps {
  onAuthSuccess: (firebaseUser: any) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'normal') => void;
}

export function AuthScreen({ onAuthSuccess, showToast }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthNotAllowed, setIsAuthNotAllowed] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [bio, setBio] = useState('');
  
  // Visual states
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email || !email.includes('@')) {
      setError('Format email tidak valid.');
      return false;
    }
    if (password.length < 6) {
      setError('Katasandi harus minimal 6 karakter.');
      return false;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Nama lengkap tidak boleh kosong.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setIsAuthNotAllowed(false);

    try {
      if (mode === 'login') {
        const user = await logInWithEmail(email, password);
        showToast(`Selamat datang kembali, ${user.displayName || 'pengguna'}! 👋`, 'success');
        onAuthSuccess(user);
      } else {
        // Register flow
        const user = await signUpWithEmail(email, password);
        
        // Formulate a beautiful initial profile
        const initialProf = {
          id: user.uid,
          name: name.trim(),
          avatar: gender === 'Laki-laki' 
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200'
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
          bio: bio.trim() || 'Halo! Saya menggunakan Dolly untuk mencari teman baru & meetup seru. ✨',
          gender,
          online: true,
          distance: '0.0 km',
          statusMessage: 'Terhubung ke database Dolly!'
        };

        // Write user profile to Firestore
        await setDoc(doc(db, 'profiles', user.uid), initialProf);
        
        showToast('Pendaftaran berhasil! Selamat bergabung di Dolly ✨', 'success');
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Terjadi kesalahan. Silakan coba lagi.';
      if (err?.code === 'auth/operation-not-allowed' || (err?.message && err.message.includes('auth/operation-not-allowed'))) {
        setIsAuthNotAllowed(true);
        errorMsg = 'Penyedia login Email/Katasandi belum diaktifkan di Firebase Console Anda.';
      } else if (err?.code === 'auth/email-already-in-use') {
        errorMsg = 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        errorMsg = 'Email atau password salah.';
      } else if (err?.code === 'auth/invalid-credential') {
        errorMsg = 'Kredensial salah. Periksa kembali email dan password Anda.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      showToast(errorMsg, 'normal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const user = await logInWithGoogle();
      showToast(`Terhubung via Google: ${user.displayName || 'Dolly User'}! 👋`, 'success');
      onAuthSuccess(user);
    } catch (err: any) {
      console.error(err);
      const errorMsg = 'Google login dibatalkan atau gagal.';
      setError(errorMsg);
      showToast(errorMsg, 'normal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestBypass = () => {
    const guestUserObj = {
      uid: 'guest_user',
      email: 'guest@dolly.web.id',
      displayName: 'Tamu Dolly',
      isAnonymous: true,
      emailVerified: true
    };
    showToast('Masuk sebagai Tamu! Menjalankan Dolly dalam Mode Simulasi Lokal', 'success');
    onAuthSuccess(guestUserObj);
  };

  return (
    <div id="auth_container" className="flex-1 flex flex-col justify-between bg-zinc-50 font-sans p-6 overflow-y-auto">
      {/* Top Brand Logo Banner */}
      <div className="flex flex-col items-center text-center mt-6 select-none">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-200 mb-4"
        >
          <Compass className="w-8 h-8 text-white animate-spin-slow" />
        </motion.div>
        <motion.h1 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight"
        >
          Dolly
        </motion.h1>
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-zinc-400 font-semibold mt-1 max-w-[280px]"
        >
          Temuan teman baru, hangout asik, dan bagikan momen seru disekitarmu! ✨
        </motion.p>
      </div>

      {/* Main interactive login/signup Card */}
      <motion.div 
        layout
        className="w-full max-w-md mx-auto bg-white rounded-[32px] border border-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 mt-8 mb-6"
      >
        <div className="text-center mb-5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider mb-2">
            ⚡ Firebase Google Sign-In Aktif
          </span>
          <h2 className="text-sm font-extrabold text-zinc-800">Metode Masuk yang Direkomendasikan</h2>
        </div>

        {/* Primary Action Button: Google Sign In */}
        <motion.button
          id="btn_google_signin"
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all outline-none shadow-md shadow-rose-100 cursor-pointer"
        >
          {/* Google Color G Icon */}
          <div className="bg-white p-1.5 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-1.52-1.01-3.13-1.01-4.72z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <span>Lanjutkan Masuk dengan Google</span>
        </motion.button>

        {/* Secondary Action: Guest Mode bypass option */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-zinc-100 w-full absolute"></div>
          <span className="bg-white px-3.5 text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest relative z-10">Bypass / Mode Tanpa Login</span>
        </div>

        <motion.button
          id="btn_guest_bypass"
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleGuestBypass}
          disabled={isLoading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all outline-none cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Masuk Sebagai Tamu (Simulasi Lokal)</span>
        </motion.button>

        {/* Divider for third party options */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-zinc-100 w-full absolute"></div>
          <span className="bg-white px-4 text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest relative z-10">Alternatif Lainnya</span>
        </div>

        {/* Collapsible Email Login & Alert section */}
        <details className="group border border-zinc-100 rounded-2xl bg-zinc-50/50 p-3 transition-all">
          <summary className="flex items-center justify-between text-xs font-black text-zinc-500 cursor-pointer list-none outline-none select-none">
            <span className="flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400 group-open:text-rose-500" />
              <span>Masuk dengan Email / Katasandi</span>
            </span>
            <span className="text-[10px] text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-4">
            <div className="bg-amber-50 border border-amber-100/70 p-3.5 rounded-xl text-amber-800 text-[10.5px] font-bold space-y-1">
              <p className="flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Email/Password dinonaktifkan di Konsol Firebase Anda</span>
              </p>
              <p className="font-medium text-amber-700 leading-relaxed">
                Karena batasan akses Firebase Starter Tier atau izin akun non-owner, metode Email/Password tidak dapat diaktifkan. <strong>Silakan gunakan tombol Google Sign-In di atas</strong> yang sudah diaktifkan oleh pengembang utama!
              </p>
            </div>

            {/* Auth Mode Tabs Switcher */}
            <div className="flex bg-zinc-100/80 p-1 rounded-2xl mb-4 font-semibold text-[11px] border border-zinc-200/40">
              <button
                id="tab_mode_login"
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-2 px-3 rounded-xl text-center transition-all duration-300 ${mode === 'login' ? 'bg-white text-zinc-800 shadow-xs font-bold' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Masuk
              </button>
              <button
                id="tab_mode_register"
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className={`flex-1 py-2 px-3 rounded-xl text-center transition-all duration-300 ${mode === 'register' ? 'bg-white text-zinc-805 shadow-xs font-bold' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Error Notification Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                  id="auth_error_alert"
                >
                  <div className="bg-rose-50 border border-rose-100/70 p-3 rounded-xl flex flex-col space-y-2 text-rose-600 text-[10px] font-bold">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                      <span>{error}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence mode="popLayout">
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                    key="register-fields-collapsible"
                  >
                    {/* Full name */}
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider mb-1">Nama Lengkap</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <input
                          id="signup_name"
                          type="text"
                          placeholder="Masukkan nama lengkap Anda"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-150 rounded-xl pl-10 pr-3 py-2.5 text-zinc-800 text-xs focus:bg-white focus:border-rose-450 focus:ring-1 focus:ring-rose-200 outline-none transition-all placeholder:text-zinc-400/80 font-bold"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider mb-1">Jenis Kelamin</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id="gender_male"
                          type="button"
                          onClick={() => setGender('Laki-laki')}
                          className={`py-2 px-3 rounded-xl text-[11px] font-bold border text-center transition-all flex items-center justify-center space-x-1 ${gender === 'Laki-laki' ? 'border-zinc-800 bg-zinc-900 text-white shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}
                        >
                          <span>Laki-laki 👦</span>
                        </button>
                        <button
                          id="gender_female"
                          type="button"
                          onClick={() => setGender('Perempuan')}
                          className={`py-2 px-3 rounded-xl text-[11px] font-bold border text-center transition-all flex items-center justify-center space-x-1 ${gender === 'Perempuan' ? 'border-zinc-800 bg-zinc-900 text-white shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}
                        >
                          <span>Perempuan 👧</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email input */}
              <div>
                <label className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider mb-1">Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="auth_email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-150 rounded-xl pl-10 pr-3 py-2.5 text-zinc-800 text-xs focus:bg-white focus:border-rose-450 focus:ring-1 focus:ring-rose-200 outline-none transition-all placeholder:text-zinc-400/80 font-bold"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider mb-1">Katasandi</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="auth_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-150 rounded-xl pl-10 pr-10 py-2.5 text-zinc-800 text-xs focus:bg-white focus:border-rose-450 focus:ring-1 focus:ring-rose-200 outline-none transition-all placeholder:text-zinc-400/80 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action button */}
              <motion.button
                id="btn_auth_submit"
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all mt-3"
              >
                <span>{mode === 'login' ? 'Masuk' : 'Daftar'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </form>
          </div>
        </details>
      </motion.div>

      {/* Aesthetic Footer Info */}
      <div className="text-center font-mono text-[9px] text-zinc-400 font-medium mb-2">
        <span>Dolly - Aplikasi WebView Full Screen Android • v1.0.0</span>
      </div>
    </div>
  );
}
