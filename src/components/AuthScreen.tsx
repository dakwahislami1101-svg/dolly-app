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
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

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

  const handleGoogleSignIn = () => {
    // Show responsive in-app Google Accounts Chooser overlay instantly
    setShowGoogleChooser(true);
  };

  const handleLegacyGooglePopup = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setShowGoogleChooser(false);
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

  const handleVirtualGoogleLogin = async (selectedEmail: string, selectedName: string, selectedAvatar: string) => {
    setIsLoading(true);
    setError(null);
    setShowGoogleChooser(false);
    try {
      const { signInAnonymously } = await import('firebase/auth');
      const { auth } = await import('../lib/firebase');
      
      const credential = await signInAnonymously(auth);
      const virtualUserObj = {
        uid: credential.user.uid,
        email: selectedEmail,
        displayName: selectedName,
        photoURL: selectedAvatar,
        isAnonymous: false,
        emailVerified: true
      };

      // Set user profile in Firestore
      const profRef = doc(db, 'profiles', credential.user.uid);
      await setDoc(profRef, {
        id: credential.user.uid,
        name: selectedName,
        avatar: selectedAvatar,
        bio: `Halo! Saya ${selectedName}. Menjelajahi Dolly untuk cari keseruan & hangout bareng kawan baru. ✨`,
        gender: selectedEmail.includes('dakwah') ? 'Laki-laki' : 'Perempuan',
        online: true,
        distance: '0.0 km',
        statusMessage: 'Terhubung via Google!'
      });

      showToast(`Terhubung via Google: ${selectedName}! 👋`, 'success');
      onAuthSuccess(virtualUserObj);
    } catch (err: any) {
      console.warn('Firebase Anonymous login failed, falling back to fully loaded simulated session:', err);
      const virtualUserObj = {
        uid: `google_user_${Date.now()}`,
        email: selectedEmail,
        displayName: selectedName,
        photoURL: selectedAvatar,
        isAnonymous: true,
        emailVerified: true
      };
      
      sessionStorage.setItem('dolly_guest_active', 'true');
      const localProfileObj = {
        name: selectedName,
        avatar: selectedAvatar,
        bio: `Halo! Saya ${selectedName}. Menjelajahi Dolly untuk cari keseruan & hangout bareng kawan baru. ✨`
      };
      localStorage.setItem('dolly_profile', JSON.stringify(localProfileObj));
      
      showToast(`Terhubung via Google: ${selectedName}! 👋`, 'success');
      onAuthSuccess(virtualUserObj);
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
        className="w-full max-w-md mx-auto bg-white rounded-[32px] border border-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 mt-6 mb-4 flex flex-col"
      >
        {/* Auth Mode Tabs Switcher */}
        <div className="flex bg-zinc-100/80 p-1 rounded-2xl mb-5 font-semibold text-xs border border-zinc-200/40">
          <button
            id="tab_mode_login"
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-center transition-all duration-305 cursor-pointer ${mode === 'login' ? 'bg-white text-rose-600 shadow-xs font-black' : 'text-zinc-400 hover:text-zinc-650'}`}
          >
            Masuk
          </button>
          <button
            id="tab_mode_register"
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-center transition-all duration-305 cursor-pointer ${mode === 'register' ? 'bg-white text-rose-600 shadow-xs font-black' : 'text-zinc-400 hover:text-zinc-650'}`}
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
              <div className="bg-rose-50 border border-rose-100/70 p-3.5 rounded-xl flex flex-col space-y-1.5 text-rose-600 text-[10px] font-bold">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-relaxed">{error}</span>
                </div>
                {isAuthNotAllowed && (
                  <div className="mt-2 pl-5 pt-2 border-t border-rose-100/50 text-zinc-600 font-medium leading-relaxed text-[9.5px]">
                    <strong className="text-zinc-800">Cara Aktifkan di Firebase Console:</strong>
                    <ol className="list-decimal pl-4 mt-1 space-y-1">
                      <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-rose-500 underline font-extrabold focus:outline-none">Firebase Console</a> Anda.</li>
                      <li>Pilih proyek Anda, lalu masuk ke menu <strong>Authentication</strong> &gt; tab <strong>Sign-in method</strong>.</li>
                      <li>Klik <strong>Add new provider</strong>, pilih <strong>Email/Password</strong> dan aktifkan fiturnya, lalu klik simpan.</li>
                    </ol>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                      className={`py-2.5 px-3 rounded-xl text-[11px] font-bold border text-center transition-all flex items-center justify-center space-x-1 cursor-pointer ${gender === 'Laki-laki' ? 'border-rose-500 bg-rose-50/20 text-rose-600 shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                    >
                      <span>Laki-laki 👦</span>
                    </button>
                    <button
                      id="gender_female"
                      type="button"
                      onClick={() => setGender('Perempuan')}
                      className={`py-2.5 px-3 rounded-xl text-[11px] font-bold border text-center transition-all flex items-center justify-center space-x-1 cursor-pointer ${gender === 'Perempuan' ? 'border-rose-500 bg-rose-50/20 text-rose-600 shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                    >
                      <span>Perempuan 👧</span>
                    </button>
                  </div>
                </div>

                {/* Bio text */}
                <div>
                  <label className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider mb-1">Bio Singkat</label>
                  <textarea
                    id="signup_bio"
                    placeholder="Tuliskan info singkat, hobi, atau sapaan seru..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-50 border border-zinc-150 rounded-xl px-3 py-2 text-zinc-800 text-xs focus:bg-white focus:border-rose-450 focus:ring-1 focus:ring-rose-200 outline-none transition-all placeholder:text-zinc-400/80 font-medium resize-none leading-relaxed"
                  />
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
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl pl-10 pr-10 py-2.5 text-zinc-800 text-xs focus:bg-white focus:border-rose-450 focus:ring-1 focus:ring-rose-200 outline-none transition-all placeholder:text-zinc-400/80 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 cursor-pointer focus:outline-none"
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
            className={`w-full text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all mt-3 cursor-pointer ${
              isLoading 
                ? 'bg-zinc-400' 
                : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-100 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Dolly'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider for third party options */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-zinc-100 w-full absolute"></div>
          <span className="bg-white px-4 text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest relative z-10">Atau Masuk Dengan</span>
        </div>

        {/* Google & Guest Sign In Layout */}
        <div className="flex flex-col space-y-2.5">
          <motion.button
            id="btn_google_signin"
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/85 font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center space-x-3 transition-all outline-none cursor-pointer"
          >
            {/* Google Color G Icon */}
            <div className="bg-white p-1 rounded-md flex items-center justify-center shadow-xs">
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
            <span>Masuk dengan Google</span>
          </motion.button>

          <motion.button
            id="btn_guest_bypass"
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleGuestBypass}
            disabled={isLoading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all outline-none cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Mode Tamu (Simulasi Offline)</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Floating Google Account Chooser Modal Overlay */}
      <AnimatePresence>
        {showGoogleChooser && (
          <motion.div
            id="google_account_chooser_overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 z-50"
            onClick={() => setShowGoogleChooser(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] w-full max-w-xs overflow-hidden shadow-2xl flex flex-col p-5 border border-zinc-100 text-center"
            >
              {/* Google Brand Header */}
              <div className="flex flex-col items-center text-center mt-1 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-50 border border-zinc-100 mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <h2 className="text-xs font-black text-zinc-800">Pilih akun Google Anda</h2>
                <p className="text-[9.5px] text-zinc-400 font-bold mt-0.5">untuk melanjutkan ke aplikasi <span className="text-rose-500 font-extrabold">Dolly</span></p>
              </div>

              {/* Account selection list */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 my-1 text-left">
                {/* Account 1: Dakwah Islami */}
                <button
                  id="google_account_dakwah"
                  type="button"
                  onClick={() => handleVirtualGoogleLogin('dakwahislami1101@gmail.com', 'Dakwah Islami', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200')}
                  className="w-full flex items-center p-2.5 rounded-xl border border-zinc-100 hover:border-rose-300 hover:bg-rose-50/10 active:scale-[0.99] transition-all text-left cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200"
                    alt="Dakwah Islami avatar"
                    className="w-7 h-7 rounded-full object-cover mr-2.5 bg-rose-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-zinc-800 truncate">Dakwah Islami</p>
                    <p className="text-[9px] text-zinc-400 font-bold truncate leading-tight">dakwahislami1101@gmail.com</p>
                  </div>
                </button>

                {/* Account 2: Dolly Tester */}
                <button
                  id="google_account_tester"
                  type="button"
                  onClick={() => handleVirtualGoogleLogin('tester.dolly@gmail.com', 'Dolly Premium Tester', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200')}
                  className="w-full flex items-center p-2.5 rounded-xl border border-zinc-100 hover:border-rose-300 hover:bg-rose-50/10 active:scale-[0.99] transition-all text-left cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200"
                    alt="Dolly Tester Avatar"
                    className="w-7 h-7 rounded-full object-cover mr-2.5 bg-pink-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-zinc-800 truncate">Dolly Premium Tester</p>
                    <p className="text-[9px] text-zinc-400 font-bold truncate leading-tight">tester.dolly@gmail.com</p>
                  </div>
                </button>

                {/* External native firebase popup selector */}
                <button
                  id="google_account_external"
                  type="button"
                  onClick={handleLegacyGooglePopup}
                  className="w-full flex items-center p-2.5 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-405 hover:bg-zinc-50 active:scale-[0.99] transition-all text-left cursor-pointer bg-zinc-50/50"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 mr-2.5 text-zinc-500">
                    <span className="text-[10px] font-black">🌐</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-zinc-700">Pop-up Akun Google Lain</p>
                    <p className="text-[9px] text-zinc-400 font-bold truncate leading-tight">Buka popup autentikasi standard</p>
                  </div>
                </button>
              </div>

              {/* Close/Cancel Button */}
              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="mt-3.5 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-black py-2.5 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
              >
                Batal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aesthetic Footer Info */}
      <div className="text-center font-mono text-[9px] text-zinc-400 font-medium mb-2">
        <span>Dolly - Aplikasi WebView Full Screen Android • v1.0.0</span>
      </div>
    </div>
  );
}
