/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Check, X } from 'lucide-react';
import { Person, FriendRequest } from '../types';

interface HomeTabProps {
  people: Person[];
  friends: Person[];
  requests: FriendRequest[];
  onOpenChat: (personId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onViewProfile: (personId: string) => void;
}

export function HomeTab({
  people,
  friends,
  requests,
  onOpenChat,
  onAcceptRequest,
  onRejectRequest,
  onViewProfile,
}: HomeTabProps) {
  // Filter out friends from the "Orang Terdekat (Nearby)" list to keep it premium or show the main ones from preview
  // In the screenshot, Aisha, Ben, Chandra, Dini, Eko, Fiona are inside "Nearby".
  // Let's grab them specifically by ID or slice first 6 items.
  const nearbyPeople = people.filter(p => ['aisha', 'ben', 'chandra', 'dini', 'eko', 'fiona'].includes(p.id));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 font-sans select-none scrollbar-none">
      {/* Top Header Logo Segment */}
      <div className="flex flex-col items-center justify-center py-2 mb-3">
        <div className="flex items-center space-x-1.5">
          <span className="font-serif italic font-black text-4xl text-rose-500 select-none tracking-tight">
            Dolly
          </span>
          <div className="w-7 h-7 bg-rose-500 rounded-xl flex items-center justify-center shadow-sm shadow-rose-300">
            <MessageCircle className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-rose-100 to-transparent mt-2"></div>
      </div>

      {/* Orang Terdekat (Nearby) Section */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
            Orang Terdekat (Nearby)
          </h2>
          <span className="text-[10px] font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
            Radar Aktif
          </span>
        </div>
        
        {/* 2x3 Grid exactly matching image layout */}
        <div className="grid grid-cols-3 gap-3">
          {nearbyPeople.map((person) => (
            <motion.div
              key={person.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewProfile(person.id)}
              className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] cursor-pointer relative hover:border-rose-100 transition-colors group"
            >
              {/* Avatar Frame */}
              <div className="relative w-14 h-14 mb-1.5">
                <img
                  src={person.avatar}
                  alt={person.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
                />
                {person.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white ring-1 ring-green-100 animate-pulse"></span>
                )}
              </div>
              
              {/* Info labels */}
              <span className="text-xs font-bold text-zinc-800 line-clamp-1 group-hover:text-rose-500 transition-colors">
                {person.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
                {person.age}, {person.distance}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Teman Saya (Friends) Section */}
      <div className="mb-5">
        <h2 className="text-sm font-bold text-zinc-900 tracking-tight mb-3">
          Teman Saya (Friends)
        </h2>
        
        <div className="bg-white rounded-2xl p-1.5 border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-1">
          {friends.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              Belum ada teman baru. Terima permintaan pertemanan di bawah!
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => onViewProfile(friend.id)}
                className="flex items-center justify-between p-2 hover:bg-slate-50 border border-transparent hover:border-zinc-100 rounded-xl transition-colors cursor-pointer group"
              >
                {/* Friend Information */}
                <div className="flex items-center space-x-3">
                  <div className="relative w-11 h-11 shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full border border-zinc-50 group-hover:scale-105 transition-transform duration-250"
                    />
                    {friend.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-1 ring-green-200"></span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 leading-tight group-hover:text-rose-500 transition-colors">
                      {friend.name}
                    </h4>
                    <span className="text-[10px] text-green-500 font-bold flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                      online
                    </span>
                  </div>
                </div>

                {/* Message Action Button (as in image) */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChat(friend.id);
                  }}
                  className="flex items-center space-x-1.5 border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 text-zinc-600 hover:text-rose-500 px-3 py-1.5 rounded-full transition-all duration-200"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Message</span>
                </motion.button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Permintaan Pertemanan (Friend Requests) Section */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-zinc-900 tracking-tight mb-3">
          Permintaan Pertemanan (Friend Requests)
        </h2>
        
        <div className="bg-white rounded-2xl p-1.5 border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <AnimatePresence mode="popLayout">
            {requests.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 text-center text-xs text-zinc-400 font-medium"
              >
                Tidak ada permintaan pertemanan baru ✨
              </motion.div>
            ) : (
              requests.map((request) => (
                <motion.div
                  key={request.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {/* Requester Info */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={request.avatar}
                      alt={request.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-full border border-zinc-100 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 leading-tight">
                        {request.name} ({request.age})
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-medium">
                        Ingin berkenalan denganmu
                      </p>
                    </div>
                  </div>

                  {/* Accept / Reject Action Indicators */}
                  <div className="flex items-center space-x-1.5">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => onAcceptRequest(request.id)}
                      className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm shadow-green-100 transition-all duration-150"
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                      <span>Terima</span>
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => onRejectRequest(request.id)}
                      className="flex items-center space-x-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-150"
                    >
                      <X className="w-3 h-3" strokeWidth={3} />
                      <span>Tolak</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
