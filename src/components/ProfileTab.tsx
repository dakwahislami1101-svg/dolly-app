/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, ShieldCheck, Heart, Sparkles, MessageCircle, Settings, ClipboardList, 
  Camera, Upload, X, Check, Trash2, Volume2, VolumeX, AlertCircle 
} from 'lucide-react';
import { Status } from '../types';

interface ProfileTabProps {
  myProfile: { name: string; avatar: string; bio: string };
  myStatuses: Status[];
  friendsCount: number;
  onUpdateProfile: (name: string, bio: string, avatar?: string) => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150', // Aisha / Beautiful portrait
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150', // Chandra / Elegant male
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150', // Dini / Casual female
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150', // Chandra 2 / Handsome male
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150', // Fiona / Gorgeous female
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150&h=150', // Leo / High contrast male
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150', // Elegant model
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150'  // Artistic portrait
];

// High-speed Canvas Avatar Resizer to stay below Firestore 1MB limits safely (~30KB JPEG payload)
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 120; // 120x120 is perfect and gorgeous as circular portrait
        let width = img.width;
        let height = img.height;
        
        // Quad crop to keep square aspect ratio
        const minSize = Math.min(width, height);
        const startX = (width - minSize) / 2;
        const startY = (height - minSize) / 2;
        
        canvas.width = maxSize;
        canvas.height = maxSize;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, minSize, minSize, 0, 0, maxSize, maxSize);
          // Compress quality to 80% to generate exceptionally lightweight Base64 string safe for cloud rules
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Format foto tidak valid'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.readAsDataURL(file);
  });
};

export function ProfileTab({ myProfile, myStatuses, friendsCount, onUpdateProfile, user, onLogin, onLogout }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(myProfile.name);
  const [profileBio, setProfileBio] = useState(myProfile.bio);
  const [profileAvatar, setProfileAvatar] = useState(myProfile.avatar);
  
  // Interactive UI modals
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Settings mock toggles containing actual impact hints
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotifToast, setShowNotifToast] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state values to parent profile updates instantly
  useEffect(() => {
    setProfileName(myProfile.name);
    setProfileBio(myProfile.bio);
    setProfileAvatar(myProfile.avatar);
  }, [myProfile]);

  const handleSave = () => {
    onUpdateProfile(profileName, profileBio, profileAvatar);
    setIsEditing(false);
  };

  const handlePresetSelect = (url: string) => {
    setProfileAvatar(url);
    onUpdateProfile(profileName, profileBio, url);
    setShowPhotoModal(false);
  };

  const handleFileUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Tolong pilih file berupa gambar/foto.');
      return;
    }

    // Guard total original size before compression to avoid heavy client-side freezing
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Ukuran file terlalu besar (Maksimal 8MB).');
      return;
    }

    try {
      setUploadError(null);
      setIsCompressing(true);
      const compressedDataUrl = await compressAndResizeImage(file);
      setProfileAvatar(compressedDataUrl);
      onUpdateProfile(profileName, profileBio, compressedDataUrl);
      setShowPhotoModal(false);
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengecilkan foto');
    } finally {
      setIsCompressing(false);
    }
  };

  // Factory reset application (fully functional utility)
  const handleClearCache = () => {
    if (confirm('Apakah kamu yakin ingin menghapus data lokal dan memulai ulang Dolly? Semua status & chat lokal akan diatur ulang.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 font-sans select-none scrollbar-none bg-slate-50 relative">
      
      {/* Title Segment */}
      <div className="flex justify-between items-center py-2 mb-3 bg-transparent">
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center">
          <User className="w-5 h-5 text-rose-500 mr-1.5" />
          Profil Saya
        </h1>
        <button 
          onClick={() => setShowSettingsModal(true)}
          className="p-1.5 bg-white border border-zinc-100 text-zinc-500 hover:text-rose-500 rounded-full transition-colors shadow-xs active:scale-95"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Styled Physical Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] mb-4 flex flex-col items-center">
        
        {/* User Portrait sphere with hovering edit actions */}
        <div 
          onClick={() => setShowPhotoModal(true)}
          className="relative w-22 h-22 mb-3 cursor-pointer group"
          title="Ubah Foto Profil"
        >
          <img
            src={profileAvatar}
            alt="My Portrait"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full border-4 border-rose-50 shadow-md transform group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute -bottom-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-2 border-2 border-white shadow-md transition-colors">
            <Camera className="w-3.5 h-3.5 shrink-0" />
          </div>
        </div>

        {/* Profile details editing vs text display */}
        {!isEditing ? (
          <div className="text-center w-full">
            <h2 className="text-base font-extrabold text-zinc-800 tracking-tight leading-tight flex items-center justify-center gap-1">
              {myProfile.name}
              <ShieldCheck className="w-4 h-4 text-rose-500 fill-rose-50 shrink-0" />
            </h2>
            <p className="text-xs text-zinc-500 font-medium max-w-[220px] mx-auto mt-1 line-clamp-2 leading-relaxed">
              &quot;{myProfile.bio}&quot;
            </p>
            
            <div className="flex gap-2 justify-center mt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100/30 px-4 py-1.5 rounded-full transition-all hover:bg-rose-100/50"
              >
                Ubah Detail Profil
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPhotoModal(true)}
                className="text-[10px] font-black text-zinc-600 bg-zinc-50 border border-zinc-100 px-4 py-1.5 rounded-full transition-all hover:bg-zinc-100"
              >
                Ganti Foto
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-3.5 mt-2">
            <div>
              <label className="text-[9.5px] font-black text-zinc-400 block mb-1 uppercase tracking-wider">Nama Tampilan</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                maxLength={25}
                className="w-full bg-zinc-50 text-zinc-800 text-xs px-3 py-2 rounded-xl border border-zinc-100 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[9.5px] font-black text-zinc-400 block mb-1 uppercase tracking-wider">Bio Status</label>
              <input
                type="text"
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                maxLength={80}
                className="w-full bg-zinc-50 text-zinc-800 text-xs px-3 py-2 rounded-xl border border-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => {
                  setProfileName(myProfile.name);
                  setProfileBio(myProfile.bio);
                  setIsEditing(false);
                }}
                className="flex-1 py-1.5 text-xs bg-zinc-100 text-zinc-500 font-bold rounded-xl active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-1.5 text-xs bg-rose-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-sm shadow-rose-100"
              >
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Firebase Database Connection Status & Action */}
      <div id="firebase_status_panel" className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${user ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider">Koneksi Database Cloud</span>
              <span className="text-xs font-bold text-zinc-800 leading-none">
                {user ? 'Terhubung (Cloud Active)' : 'Mode Lokal (Offline)'}
              </span>
            </div>
          </div>
          {user ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Keluar
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogin}
              className="text-[10px] font-black text-white bg-rose-500 px-3 py-1.5 rounded-xl hover:bg-rose-600 shadow-sm shadow-rose-100 transition-colors"
            >
              Hubungkan
            </motion.button>
          )}
        </div>
        {user && (
          <div className="mt-2.5 pt-2 border-t border-zinc-50 flex items-center justify-between text-[10px]">
            <span className="text-zinc-400 font-medium">Email: <b className="text-zinc-650">{user.email || 'Email Google'}</b></span>
            <span className="text-emerald-500 font-black flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></span>
              Sinkronisasi Aktif
            </span>
          </div>
        )}
      </div>

      {/* Gamified Statistical Achievement Counters Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4 select-none">
        <div className="bg-white rounded-2xl p-2.5 border border-zinc-100 text-center shadow-xs">
          <span className="text-sm font-black text-rose-500 block leading-tight">{friendsCount}</span>
          <span className="text-[9px] text-zinc-400 font-bold block mt-0.5 leading-snug">Total Teman</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-zinc-100 text-center shadow-xs">
          <span className="text-sm font-black text-rose-500 block leading-tight">{myStatuses.length}</span>
          <span className="text-[9px] text-zinc-400 font-bold block mt-0.5 leading-snug">Momen Status</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-zinc-100 text-center shadow-xs">
          <span className="text-sm font-black text-rose-500 block leading-tight">{myStatuses.length + friendsCount * 2}</span>
          <span className="text-[9px] text-zinc-400 font-bold block mt-0.5 leading-snug">Sapaan Sellular</span>
        </div>
      </div>

      {/* List section of Status posts published by Me */}
      <div className="mb-4">
        <h3 className="text-[10.5px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1 flex items-center">
          <ClipboardList className="w-3 h-3 mr-1" />
          Status Saya ({myStatuses.length})
        </h3>

        {myStatuses.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-zinc-100 text-center text-xs text-zinc-400 font-medium shadow-xs">
            📢 Kamu belum memposting status. Bagikan status baru pertamamu di tab Momen!
          </div>
        ) : (
          <div className="space-y-3">
            {myStatuses.map((status) => (
              <div
                key={status.id}
                className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-xs text-left"
              >
                <div className="flex justify-between items-center mb-1.5 border-b border-zinc-50 pb-1.5">
                  <span className="text-[9px] font-semibold text-zinc-400">
                    Diposting {status.timestamp}
                  </span>
                  <span className="text-[9px] font-bold text-rose-400">
                    Dolly Momen
                  </span>
                </div>
                
                <p className="text-[11.5px] text-zinc-700 leading-normal mb-2 whitespace-pre-wrap font-normal">
                  {status.text}
                </p>

                {status.image && (
                  <div className="rounded-xl overflow-hidden mb-2 border border-zinc-50">
                    <img
                      src={status.image}
                      alt="Moment content visual representation"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[120px] object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3 text-[9px] text-zinc-400 font-bold pt-1.5">
                  <span className="flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{status.likes.length} Suka</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageCircle className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{status.comments.length} Komentar</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1. INTERACTIVE AVATAR SELECTOR & COMPRESSOR MODAL */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 bg-zinc-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full border border-zinc-100 shadow-xl relative"
            >
              <button 
                onClick={() => {
                  setShowPhotoModal(false);
                  setUploadError(null);
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wider mb-1">Ganti Foto Profil</h3>
              <p className="text-[11px] text-zinc-450 mb-4 font-medium leading-relaxed">Pilih avatar cantik bawaan Dolly atau unggah foto asli terbaik kamu.</p>

              {/* Upload custom picture sector */}
              <div 
                onClick={handleFileUploadTrigger}
                className="border-2 border-dashed border-zinc-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50 hover:bg-rose-50/20 group mb-4"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {isCompressing ? (
                  <div className="flex flex-col items-center py-2">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-1.5"></div>
                    <span className="text-[10px] font-bold text-zinc-500">Mengecilkan foto...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-450 group-hover:text-rose-500 transition-colors shadow-xs mb-1.5">
                      <Upload className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[11px] font-black text-zinc-700 tracking-tight">Unggah dari galeri hp</span>
                    <span className="text-[9.5px] text-zinc-400 mt-0.5 font-medium">Format JPG/PNG (Maks 8MB)</span>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="mb-4 bg-amber-50 rounded-xl p-3 border border-amber-100/60 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[10.5px] font-bold text-amber-700 leading-tight">{uploadError}</span>
                </div>
              )}

              {/* Grid of beautiful preconfigured avatar assets */}
              <div className="border-t border-zinc-100 pt-3.5">
                <span className="text-[10px] font-black text-zinc-400 block mb-2.5 uppercase tracking-wider">Atau Pilih Avatar Preset Dolly</span>
                
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetSelect(url)}
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all active:scale-95 ${profileAvatar === url ? 'border-rose-500 ring-2 ring-rose-100' : 'border-zinc-100 hover:border-zinc-300'}`}
                    >
                      <img 
                        src={url} 
                        alt={`Preset ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      {profileAvatar === url && (
                        <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                          <div className="bg-rose-500 text-white rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[4]" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowPhotoModal(false);
                  setUploadError(null);
                }}
                className="w-full mt-5 py-2 bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-650 text-xs rounded-xl transition-all active:scale-95"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. INTERACTIVE APP SETTINGS PANEL MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-zinc-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full border border-zinc-100 shadow-xl relative"
            >
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wider mb-1 flex items-center">
                <Settings className="w-4 h-4 text-rose-500 mr-1.5" />
                Pengaturan Dolly
              </h3>
              <p className="text-[11px] text-zinc-450 mb-4 font-medium leading-relaxed">Kelola preferensi akun & kontrol aplikasi mobile Dolly.</p>

              {/* Audio/Tactile Sound Settings option */}
              <div className="space-y-3.5 mb-5">
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4.5 h-4.5 text-rose-500" />
                    ) : (
                      <VolumeX className="w-4.5 h-4.5 text-zinc-450" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">Efek Suara Sapaan</span>
                      <span className="text-[9.5px] text-zinc-400 block font-medium">Beri respon audio ketika gelombang dikirim</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      if ((window as any).soundToggleCallback) (window as any).soundToggleCallback();
                    }}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 outline-none ${soundEnabled ? 'bg-rose-500' : 'bg-zinc-200'}`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${soundEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Match Notification Settings option */}
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <Heart className="w-4.5 h-4.5 text-rose-500" />
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">Notifikasi Kecocokan</span>
                      <span className="text-[9.5px] text-zinc-400 block font-medium">Sinyal instan ketika menerima gelombang</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotifToast(!showNotifToast)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 outline-none ${showNotifToast ? 'bg-rose-500' : 'bg-zinc-200'}`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${showNotifToast ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Clear local databases option */}
                <div className="border-t border-zinc-100 pt-3.5">
                  <span className="text-[10px] font-black text-zinc-400 block mb-2 uppercase tracking-wider">Pemeliharaan Aplikasi</span>
                  
                  <button
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-between p-3 text-red-650 hover:bg-red-50/30 rounded-xl border border-red-100 transition-colors bg-white mt-1 group"
                  >
                    <div className="flex items-center space-x-2 text-left">
                      <Trash2 className="w-4 h-4 text-red-500 group-hover:animate-bounce" />
                      <div>
                        <span className="text-xs font-black text-rose-600 block">Bersihkan Memory Cache</span>
                        <span className="text-[9.5px] text-zinc-400 block font-medium">Hapus semua chat & status lokal / mulai baru</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Version & Developer information footer */}
              <div className="bg-zinc-50 rounded-xl p-3 text-center border border-zinc-100">
                <span className="text-[10px] font-black text-zinc-450 block uppercase tracking-widest">Dolly Dating v2.4-Hybrid</span>
                <span className="text-[8.5px] text-zinc-400 block font-medium mt-0.5">Ditenagai oleh Firebase Cloud FireStore & PWA Service Worker</span>
              </div>

              <button 
                onClick={() => setShowSettingsModal(false)}
                className="w-full mt-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-100 transition-all active:scale-95"
              >
                Sudah Selesai
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
