/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, ShieldCheck, MessageSquare, MapPin, 
  Sparkles, Calendar, Zap, AlertCircle, Compass, Check
} from 'lucide-react';
import { Person } from '../types';

interface UserProfileModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (personId: string) => void;
  onSendWave: (personId: string) => void;
  hasWaved: boolean;
}

export function UserProfileModal({
  person,
  isOpen,
  onClose,
  onOpenChat,
  onSendWave,
  hasWaved,
}: UserProfileModalProps) {
  if (!person) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 select-none">
          {/* Dimmed Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-pointer"
          />

          {/* Core Sliding Profile Card */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden border border-zinc-100 shadow-2xl z-10 flex flex-col relative max-h-[92vh] sm:max-h-[85vh]"
          >
            {/* Top Back/Dismiss Touch target bar for mobile */}
            <div className="w-full flex items-center justify-center py-2.5 sm:hidden shrink-0">
              <div className="w-10 h-1 bg-zinc-200 rounded-full"></div>
            </div>

            {/* Quick close button on top right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-zinc-950/40 hover:bg-zinc-950/60 backdrop-blur-md text-white p-2 rounded-full transition-colors z-20 shadow-md cursor-pointer active:scale-90"
              title="Tutup Profil"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Scrollable details view */}
            <div className="flex-1 overflow-y-auto pb-6">
              {/* Cover & Avatar Header */}
              <div className="relative h-56 shrink-0 bg-gradient-to-tr from-rose-500/80 to-pink-650/80 overflow-hidden">
                {/* Blur Background Cover Image */}
                <img
                  src={person.avatar}
                  alt={person.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter blur-[8px] scale-110 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                
                {/* Central Portrait frame */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <div className="relative w-28 h-28">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl"
                    />
                    {person.online ? (
                      <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white ring-1 ring-green-200 animate-pulse"></span>
                    ) : (
                      <span className="absolute bottom-1 right-1 w-5 h-5 bg-zinc-400 rounded-full border-4 border-white"></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Info Card */}
              <div className="px-6 text-center mt-2">
                {/* Title & Age / Sex badge */}
                <h2 className="text-xl font-extrabold text-zinc-900 leading-tight flex items-center justify-center gap-1.5 flex-wrap">
                  {person.name}
                  <ShieldCheck className="w-5 h-5 text-rose-500 fill-rose-50 shrink-0" />
                </h2>

                <div className="flex items-center justify-center space-x-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-black text-white px-2.5 py-0.5 rounded-full flex items-center shrink-0 ${
                    person.gender === 'Perempuan' ? 'bg-pink-500' : 'bg-blue-500'
                  }`}>
                    {person.gender === 'Perempuan' ? '♀ Perempuan' : '♂ Laki-laki'} • {person.age} Thn
                  </span>

                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100/50 px-2.5 py-0.5 rounded-full flex items-center">
                    <MapPin className="w-3 h-3 mr-0.5 text-rose-400" />
                    {person.distance}
                  </span>
                </div>

                <div className="w-12 h-0.5 bg-rose-100 mx-auto my-4 rounded-full"></div>

                {/* Match Statistics Badges */}
                <div className="grid grid-cols-3 gap-2 px-1 mb-5">
                  <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-100 text-center shadow-xs">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Kecocokan</span>
                    <span className="text-xs font-black text-rose-500 block mt-0.5 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 mr-0.5 text-amber-500 fill-amber-300" />
                      {person.id === 'aisha' ? '98%' : person.id === 'ben' ? '82%' : person.id === 'chandra' ? '89%' : person.id === 'dini' ? '95%' : '85%'}
                    </span>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-100 text-center shadow-xs">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Status Sapa</span>
                    <span className="text-xs font-black text-rose-500 block mt-0.5">
                      {person.online ? 'Aktif' : 'Offline'}
                    </span>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-100 text-center shadow-xs">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Respon</span>
                    <span className="text-xs font-black text-rose-500 block mt-0.5 flex items-center justify-center">
                      <Zap className="w-3 h-3 mr-0.5 text-rose-400 fill-rose-100" />
                      &lt; 5 mnt
                    </span>
                  </div>
                </div>

                {/* About Bio / Status Box */}
                <div className="space-y-4 text-left">
                  {person.statusMessage && (
                    <div className="bg-rose-50/40 p-3 rounded-2xl border border-rose-100/30">
                      <span className="text-[9.5px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">Momen Status Hari Ini</span>
                      <p className="text-xs text-zinc-700 font-medium italic leading-relaxed">
                        &quot;{person.statusMessage}&quot;
                      </p>
                    </div>
                  )}

                  <div className="p-1">
                    <span className="text-[9.5px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Tentang Saya</span>
                    <p className="text-xs text-zinc-650 font-medium leading-relaxed bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                      {person.bio || 'Pengguna Dolly yang ramah dan ingin mencari teman baru di sekitarnya.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar / CTAs Footer */}
            <div className="bg-zinc-50 border-t border-zinc-150 p-4 shrink-0 flex items-center space-x-2.5">
              {/* Send Wave button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSendWave(person.id)}
                disabled={hasWaved}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-2xl text-[11px] font-black tracking-wide shadow-sm transition-all duration-200 cursor-pointer ${
                  hasWaved
                    ? 'bg-zinc-200 text-zinc-400 cursor-default border border-zinc-150'
                    : 'bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 shadow-rose-100'
                }`}
              >
                {hasWaved ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-400" strokeWidth={2.5} />
                    <span>Sudah Tersapa</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">👋</span>
                    <span>Sapa Orang Terdekat</span>
                  </>
                )}
              </motion.button>

              {/* Chat action button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onOpenChat(person.id);
                  onClose();
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] tracking-wide py-3 rounded-2xl flex items-center justify-center space-x-1.5 shadow-md shadow-rose-100 cursor-pointer transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-white text-rose-500" />
                <span>Mulai Obrolan / Chat</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
