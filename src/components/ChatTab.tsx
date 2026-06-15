/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, PenLine, MessageSquareOff } from 'lucide-react';
import { Chat, Person } from '../types';

interface ChatTabProps {
  chats: Chat[];
  people: Person[];
  onOpenChat: (personId: string) => void;
}

export function ChatTab({ chats, people, onOpenChat }: ChatTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Find person details for each chat log
  const chatSessionsWithPeople = chats
    .map(chat => {
      const person = people.find(p => p.id === chat.personId);
      return {
        ...chat,
        person
      };
    })
    .filter(session => {
      if (!session.person) return false;
      return session.person.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    // Sort so unread or newest timestamp comes first
    .sort((a, b) => (b.unreadCount > 0 ? 1 : 0) - (a.unreadCount > 0 ? 1 : 0));

  return (
    <div className="flex-1 overflow-hidden flex flex-col font-sans select-none">
      {/* Title Segment */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-center bg-white border-b border-zinc-100 shrink-0">
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
          Chats
        </h1>
        <button className="p-1.5 hover:bg-slate-50 text-rose-500 rounded-full transition-colors">
          <PenLine className="w-5 h-5" />
        </button>
      </div>

      {/* Styled Interactive Search Bar */}
      <div className="p-3 bg-white border-b border-zinc-50 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari obrolan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 text-zinc-800 placeholder-zinc-400 text-xs pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400/50 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* List content of Chats */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1">
        {chatSessionsWithPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 px-6">
            <MessageSquareOff className="w-10 h-10 text-zinc-300 stroke-1 mb-2" />
            <p className="text-xs font-semibold">Tidak ada obrolan ditemukan</p>
            <p className="text-[10px] text-zinc-400 max-w-[200px] mt-1">
              Ketuk 'Message' pada teman atau sapa orang terdekatmu di menu Home/Near Me!
            </p>
          </div>
        ) : (
          chatSessionsWithPeople.map((session) => {
            const { person } = session;
            if (!person) return null;

            return (
              <motion.div
                key={session.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenChat(person.id)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                  session.unreadCount > 0 ? 'bg-rose-50/40 border border-rose-100/40' : 'hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                {/* User Portrait with Status badge */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative w-12 h-12 shrink-0">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full border border-zinc-50/50"
                    />
                    {person.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>

                  {/* Message labels */}
                  <div className="min-w-0">
                    <div className="flex items-baseline space-x-1">
                      <h4 className="text-xs font-bold text-zinc-800 leading-tight">
                        {person.name}
                      </h4>
                      <span className="text-[9px] font-medium text-zinc-400 px-1 py-0.2 bg-zinc-100 rounded">
                        {person.distance}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-snug truncate mt-0.5 max-w-[200px] ${
                      session.unreadCount > 0 ? 'text-zinc-900 font-semibold' : 'text-zinc-500 font-medium'
                    }`}>
                      {session.lastMessage}
                    </p>
                  </div>
                </div>

                {/* Meta status info (Right Area) */}
                <div className="flex flex-col items-end shrink-0 space-y-1 ml-2">
                  <span className="text-[10px] text-zinc-400 font-semibold tracking-tight">
                    {session.timestamp}
                  </span>
                  
                  {session.unreadCount > 0 && (
                    <span className="bg-rose-500 min-w-[18px] h-[18px] text-white text-[9.5px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
                      {session.unreadCount}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
