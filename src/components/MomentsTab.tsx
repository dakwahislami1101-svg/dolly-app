/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, Flame, MapPin, Send, Plus, X, Image as ImageIcon, Trash2, EyeOff } from 'lucide-react';
import { Status, Person } from '../types';

interface MomentsTabProps {
  statuses: Status[];
  myProfile: { name: string; avatar: string };
  user?: any;
  onLikeStatus: (id: string, name: string) => void;
  onCommentStatus: (id: string, commentText: string) => void;
  onPostStatus: (text: string, imageUrl?: string) => void;
  onDeleteStatus: (id: string) => void;
}

export function MomentsTab({
  statuses,
  myProfile,
  user,
  onLikeStatus,
  onCommentStatus,
  onPostStatus,
  onDeleteStatus,
}: MomentsTabProps) {
  const [isOpenCreator, setIsOpenCreator] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);
  
  // Inline comment inputs mapped by status ID
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  const presetPhotos = [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600&h=400', // beach walk
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600&h=400', // healthy food
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600&h=400', // forest park
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600&h=400'  // scenic road
  ];

  const handleOwnPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedPhotoUrl(resizedDataUrl);
        } else {
          setSelectedPhotoUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePostSubmit = () => {
    if (!newStatusText.trim()) return;
    onPostStatus(newStatusText, selectedPhotoUrl || undefined);
    setNewStatusText('');
    setSelectedPhotoUrl(null);
    setIsOpenCreator(false);
  };

  const handleCommentSubmit = (statusId: string) => {
    const text = commentInputs[statusId];
    if (!text || !text.trim()) return;
    
    onCommentStatus(statusId, text);
    
    // Clear form
    setCommentInputs(prev => ({
      ...prev,
      [statusId]: ''
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto font-sans select-none scrollbar-none relative bg-slate-50">
      
      {/* Title Header area */}
      <div className="bg-white border-b border-zinc-100 p-4 shrink-0 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center">
            <Flame className="w-5 h-5 text-rose-500 mr-1.5 fill-rose-100" />
            Momen Dolly
          </h1>
          <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">
            Berbagi status & cerita terdekat
          </span>
        </div>
        
        {/* Post Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpenCreator(true)}
          className="flex items-center space-x-1 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold px-3 py-2 rounded-full shadow-sm shadow-rose-200 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          <span>Bagikan Status</span>
        </motion.button>
      </div>

      {/* Creating status overlay */}
      <AnimatePresence>
        {isOpenCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40"
          >
            <motion.div
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-[340px] p-4 flex flex-col shadow-xl"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-zinc-800">Posting Status Baru</h3>
                <button
                  onClick={() => setIsOpenCreator(false)}
                  className="p-1 hover:bg-zinc-100 rounded-full"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Status textarea */}
              <textarea
                placeholder="Apa yang ingin kamu bagikan hari ini?"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 border border-zinc-100 bg-zinc-50 rounded-2xl focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white resize-none font-medium h-24"
              />

              {/* Image attachments picker */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wide">
                  Tambahkan Foto (Opsional)
                </span>
                <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {/* Custom upload tile */}
                  <label className={`w-14 h-11 rounded-md cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center shrink-0 border-zinc-200 hover:border-rose-450 hover:bg-rose-50/20 relative overflow-hidden ${selectedPhotoUrl && !presetPhotos.includes(selectedPhotoUrl) ? 'border-rose-500 bg-rose-50/10' : ''}`}>
                    <input
                      type="file"
                      id="upload_own_photo"
                      accept="image/*"
                      className="hidden"
                      onChange={handleOwnPhotoUpload}
                    />
                    {selectedPhotoUrl && !presetPhotos.includes(selectedPhotoUrl) ? (
                      <img
                        src={selectedPhotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        <span className="text-[7px] text-zinc-400 font-extrabold mt-0.5">Upload</span>
                      </div>
                    )}
                  </label>

                  {presetPhotos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt="Preset option"
                      onClick={() => setSelectedPhotoUrl(selectedPhotoUrl === photo ? null : photo)}
                      referrerPolicy="no-referrer"
                      className={`w-14 h-11 object-cover rounded-md cursor-pointer transition-all border-2 shrink-0 ${
                        selectedPhotoUrl === photo ? 'border-rose-500 scale-95 opacity-100' : 'border-transparent opacity-75'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setIsOpenCreator(false)}
                  className="flex-1 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handlePostSubmit}
                  disabled={!newStatusText.trim()}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl text-white transition-all ${
                    newStatusText.trim()
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-100'
                      : 'bg-zinc-300 cursor-not-allowed'
                  }`}
                >
                  Bagikan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Renders dynamic Status Feed */}
      <div className="p-3 space-y-4">
        {statuses.map((status) => {
          const isLikedByMe = status.likes.includes(myProfile.name);

          return (
            <motion.div
              layout
              key={status.id}
              className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col"
            >
              {/* Creator details */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-3">
                  <img
                    src={status.authorAvatar}
                    alt={status.authorName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-full border border-zinc-100 shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 leading-tight">
                      {status.authorName}
                    </h4>
                    <span className="text-[9px] text-zinc-400 font-semibold flex items-center">
                      <MapPin className="w-2.5 h-2.5 text-zinc-300 mr-0.5" />
                      Kebagusan • {status.timestamp}
                    </span>
                  </div>
                </div>

                {/* Delete or Hide action */}
                {(() => {
                  const isMyStatus = status.personId === 'me' || (user && status.personId === user.uid);
                  return (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (confirm(isMyStatus ? 'Apakah Anda yakin ingin menghapus status ini secara permanen?' : 'Sembunyikan status ini dari feed Anda?')) {
                          onDeleteStatus(status.id);
                        }
                      }}
                      title={isMyStatus ? 'Hapus Status Momen' : 'Sembunyikan Status Momen'}
                      className={`p-2 rounded-full cursor-pointer transition-all ${
                        isMyStatus 
                          ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50/50' 
                          : 'text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100/50'
                      }`}
                    >
                      {isMyStatus ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </motion.button>
                  );
                })()}
              </div>

              {/* Status Message Text */}
              <p className="text-[11.5px] text-zinc-700 leading-relaxed font-normal whitespace-pre-wrap mb-2.5">
                {status.text}
              </p>

              {/* Optional Photo attachment block */}
              {status.image && (
                <div 
                  className="rounded-2xl overflow-hidden mb-3 border border-zinc-100 leading-none cursor-pointer group relative overflow-hidden"
                  onClick={() => setZoomPhotoUrl(status.image)}
                >
                  <img
                    src={status.image}
                    alt="Moment post representation"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[190px] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="bg-black/50 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-xs">
                      Klik untuk Memperbesar 🔍
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Like / Comment count indicators */}
              <div className="flex items-center space-x-4 border-y border-zinc-50 py-2 mb-2">
                {/* Like buttons */}
                <button
                  onClick={() => onLikeStatus(status.id, myProfile.name)}
                  className={`flex items-center space-x-1.5 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 ${
                    isLikedByMe ? 'text-rose-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLikedByMe ? 'fill-rose-500' : ''}`} />
                  <span>{status.likes.length} Suka</span>
                </button>

                {/* Comment summary label */}
                <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 font-bold">
                  <MessageSquare className="w-4 h-4" />
                  <span>{status.comments.length} Komentar</span>
                </div>
              </div>

              {/* Sub list area: Comments logs */}
              {status.comments.length > 0 && (
                <div className="bg-zinc-50/50 rounded-2xl p-2.5 space-y-2 mb-2.5 text-left border border-zinc-100/30">
                  {status.comments.map((comment) => (
                    <div key={comment.id} className="text-[11px] leading-tight flex items-start space-x-1 flex-wrap">
                      <span className="font-bold text-zinc-800 shrink-0">
                        {comment.authorName}:
                      </span>
                      <span className="text-zinc-600 font-medium">
                        {comment.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Inline TextInput Form */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Tulis balasan komentar..."
                  value={commentInputs[status.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [status.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCommentSubmit(status.id);
                    }
                  }}
                  className="flex-1 bg-zinc-100 text-[10.5px] placeholder-zinc-400 text-zinc-800 font-medium py-2 px-3.5 rounded-full focus:outline-none focus:ring-1 focus:ring-rose-400/50 focus:bg-white transition-all"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCommentSubmit(status.id)}
                  disabled={!commentInputs[status.id]?.trim()}
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 ${
                    commentInputs[status.id]?.trim()
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-100'
                      : 'bg-zinc-100 text-zinc-300'
                  }`}
                >
                  <Send className="w-3 h-3" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Photo Zoom Viewer Overlay */}
      <AnimatePresence>
        {zoomPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[99999]"
            onClick={() => setZoomPhotoUrl(null)}
          >
            {/* Top Bar Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-50">
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">Dolly Penampil Foto</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomPhotoUrl(null);
                }}
                className="p-2 hover:bg-white/10 active:scale-95 transition-all text-white rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image Container with spring scale transition */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-full max-h-[75vh] flex items-center justify-center"
            >
              <img
                src={zoomPhotoUrl}
                alt="Status Media Berukuran Penuh"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none pointer-events-auto"
              />
            </motion.div>

            {/* Instruction Footer */}
            <div className="absolute bottom-6 text-center select-none">
              <span className="text-white/40 text-[10px] font-medium tracking-wide">
                Ketuk di mana saja untuk kembali
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
