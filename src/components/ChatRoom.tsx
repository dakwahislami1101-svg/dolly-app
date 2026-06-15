/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, Image, Mic, MoreVertical, Phone, Play, Pause, Smile } from 'lucide-react';
import { Person, Message } from '../types';
import { getSmartReply } from '../data';

interface ChatRoomProps {
  person: Person;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text: string, type?: 'text' | 'image' | 'voice', mediaUrl?: string) => void;
}

const EMOJI_SHORTCUTS = ['😀', '😍', '👍', '🙏', '🔥', '🍜', '☕', '😂'];

export function ChatRoom({ person, messages, onBack, onSendMessage }: ChatRoomProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for this specific match
  const conversation = messages.filter(
    (m) => m.senderId === person.id || m.senderId === 'me'
  );

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.length, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    
    // 1. Send our message
    onSendMessage(textToSend, 'text');

    // 2. Schedule smart automated reply
    setIsTyping(true);
    const typingDuration = Math.min(1500 + Math.random() * 1500, 2500);
    
    setTimeout(() => {
      setIsTyping(false);
      const replyText = getSmartReply(person.id, textToSend);
      onSendMessage(replyText, 'text');
    }, typingDuration);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Simulate sharing a photo
  const handleSendPhoto = () => {
    const photos = [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400&h=300', // cafe
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=400&h=300', // aesthetic
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300'  // healthy salad
    ];
    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
    onSendMessage('Mengirim foto...', 'image', randomPhoto);

    // AI typing reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      onSendMessage('Waaahh fotonya keren bangett! Dimana itu? 😍', 'text');
    }, 2000);
  };

  // Simulate sending a voice note
  const handleSendVoiceNote = () => {
    onSendMessage('Pesan suara', 'voice', '0:08');

    // AI reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      onSendMessage('Suaramu bagus juga ya, kedengerannya ramah banget wkwk 🙈', 'text');
    }, 2000);
  };

  // Toggle play/pause for voice notes
  const toggleVoicePlay = (msgId: string) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      // Automatically stop after 3 seconds to simulate ending
      setTimeout(() => {
        setPlayingVoiceId((current) => (current === msgId ? null : current));
      }, 3000);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-100 font-sans relative">
      
      {/* App Room Header */}
      <div className="bg-white border-b border-zinc-100 px-3 py-2 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-2">
          {/* Back trigger */}
          <button 
            onClick={onBack}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-zinc-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {/* Avatar & Status */}
          <div className="flex items-center space-x-2.5">
            <div className="relative w-10 h-10 shrink-0">
              <img
                src={person.avatar}
                alt={person.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full border border-zinc-100"
              />
              {person.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 leading-tight">
                {person.name}
              </h3>
              <span className="text-[10px] text-green-500 font-medium flex items-center">
                <span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span>
                Sedang aktif
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-3 text-zinc-500">
          <button className="p-1 hover:bg-slate-100 rounded-full text-rose-500">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded-full">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Info Status Hint bar */}
      <div className="bg-rose-50/70 border-b border-rose-100/50 px-4 py-1.5 text-center text-[10px] text-rose-600 font-medium shrink-0">
        🤫 Status Bio: &quot;{person.statusMessage || person.bio}&quot;
      </div>

      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/50">
        {conversation.map((msg, index) => {
          const isMe = msg.senderId === 'me';
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              key={msg.id || index}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end space-x-1.5 max-w-[80%]">
                {!isMe && (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 object-cover rounded-full select-none"
                  />
                )}

                <div className="flex flex-col">
                  {/* Bubble styling based on content types */}
                  {msg.type === 'image' ? (
                    <div className="bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm leading-none">
                      <img
                        src={msg.mediaUrl}
                        alt="Shared view"
                        referrerPolicy="no-referrer"
                        className="rounded-xl max-w-[200px] max-h-[150px] object-cover"
                      />
                      <span className="text-[9px] text-zinc-400 block text-right mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ) : msg.type === 'voice' ? (
                    <div className={`p-3 rounded-2xl flex items-center space-x-3 min-w-[150px] shadow-sm ${
                      isMe ? 'bg-rose-500 text-white' : 'bg-white text-zinc-800 border border-zinc-100'
                    }`}>
                      <button
                        onClick={() => toggleVoicePlay(msg.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-rose-100 text-rose-500'
                        }`}
                      >
                        {playingVoiceId === msg.id ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="w-24 h-4 flex items-center space-x-0.5">
                          {/* Animated voice frequency lines */}
                          {[...Array(12)].map((_, i) => (
                            <span
                              key={i}
                              style={{
                                height: playingVoiceId === msg.id 
                                  ? `${30 + Math.sin(i + Date.now()) * 60}%` 
                                  : '20%'
                              }}
                              className={`w-[2px] transition-all rounded ${
                                isMe ? 'bg-white' : 'bg-rose-400'
                              }`}
                            ></span>
                          ))}
                        </div>
                        <span className="text-[9px] opacity-80 font-bold block mt-0.5">
                          {msg.mediaUrl} • Slide to cancel
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-400 self-end ml-1">{msg.timestamp}</span>
                    </div>
                  ) : (
                    // Regular Text bubble
                    <div className={`py-2 px-3.5 rounded-2xl text-xs leading-relaxed shadow-sm font-medium ${
                      isMe 
                        ? 'bg-rose-500 text-white rounded-tr-none rounded-br-2xl' 
                        : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-100'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`text-[9px] block text-right mt-1.5 leading-none font-medium ${
                        isMe ? 'text-rose-100' : 'text-zinc-400'
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Dynamic Typing indicators */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-start items-center space-x-1.5"
            >
              <img
                src={person.avatar}
                alt={person.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 object-cover rounded-full"
              />
              <div className="bg-white py-2 px-3 rounded-2xl rounded-tl-none border border-zinc-100 flex items-center space-x-1 shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold mr-1">{person.name} sedang mengetik</span>
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji shortcuts and attachment panel */}
      <div className="bg-white border-t border-zinc-100 px-3 py-1.5 flex items-center space-x-1 overflow-x-auto shrink-0 scrollbar-none select-none z-10 shadow-sm">
        {EMOJI_SHORTCUTS.map(emoji => (
          <button
            key={emoji}
            onClick={() => setInputText(prev => prev + emoji)}
            className="text-lg px-2 py-0.5 hover:bg-slate-50 active:scale-90 transition-all rounded"
          >
            {emoji}
          </button>
        ))}
        <div className="h-4 w-[1px] bg-zinc-200 mx-1 shrink-0"></div>
        
        {/* Rapid attachment shortcuts */}
        <button
          onClick={handleSendPhoto}
          title="Kirim Foto"
          className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-md shrink-0 flex items-center space-x-0.5"
        >
          <Image className="w-4 h-4" />
          <span className="text-[10px] font-bold">Foto</span>
        </button>

        <button
          onClick={handleSendVoiceNote}
          title="Kirim Pesan Suara"
          className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-md shrink-0 flex items-center space-x-0.5"
        >
          <Mic className="w-4 h-4" />
          <span className="text-[10px] font-bold">Suara</span>
        </button>
      </div>

      {/* Primary Message Input Drawer */}
      <div className="bg-white px-3 pb-4 pt-1.5 flex items-center space-x-2 shrink-0 border-t border-zinc-50">
        <div className="flex-1 bg-zinc-100 rounded-full px-3.5 py-2 flex items-center">
          <Smile className="w-4.5 h-4.5 text-zinc-400 mr-2 shrink-0 cursor-pointer hover:text-rose-500" />
          <input
            type="text"
            placeholder="Tulis pesan..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none font-medium"
          />
        </div>

        {/* Smart contextual button logic */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          className={`w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 shadow-md ${
            inputText.trim() 
              ? 'bg-rose-500 text-white shadow-rose-200' 
              : 'bg-zinc-100 text-zinc-400'
          }`}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
