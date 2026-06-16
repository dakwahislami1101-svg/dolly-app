/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Compass, Check, Users, User, ArrowUpDown, MessageSquare } from 'lucide-react';
import { Person } from '../types';

interface NearMeTabProps {
  people: Person[];
  onOpenChat: (personId: string) => void;
  onSendWave: (personId: string) => void;
  onViewProfile: (personId: string) => void;
}

type GenderFilter = 'Semua' | 'Perempuan' | 'Laki-laki';

export function NearMeTab({ people, onOpenChat, onSendWave, onViewProfile }: NearMeTabProps) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Semua');
  const [radarScanning, setRadarScanning] = useState(false);
  const [wavedIds, setWavedIds] = useState<string[]>([]);

  // Filter folks
  const filteredPeople = people.filter(p => {
    if (genderFilter === 'Semua') return true;
    return p.gender === genderFilter;
  });

  const triggerRadarScan = () => {
    setRadarScanning(true);
    setTimeout(() => {
      setRadarScanning(false);
    }, 2000);
  };

  const handleWave = (personId: string) => {
    if (wavedIds.includes(personId)) return;
    setWavedIds(prev => [...prev, personId]);
    onSendWave(personId);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col font-sans select-none">
      
      {/* Search Filter Header Tab */}
      <div className="bg-white border-b border-zinc-100 p-3 shrink-0 flex items-center justify-between">
        <h1 className="text-sm font-bold text-zinc-900 flex items-center">
          <Compass className="w-4.5 h-4.5 mr-1.5 text-rose-500" />
          Temukan Orang Terdekat
        </h1>
        
        {/* Toggle options */}
        <div className="flex bg-zinc-100 rounded-lg p-0.5 text-[10px] font-bold">
          {(['Semua', 'Perempuan', 'Laki-laki'] as GenderFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setGenderFilter(filter)}
              className={`px-2 py-1 rounded-md transition-all ${
                genderFilter === filter
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive RADAR space container */}
      <div className="bg-rose-50/20 py-4 px-6 border-b border-rose-100/30 flex flex-col items-center shrink-0 relative overflow-hidden">
        {/* Absolute radar orbits design */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 rounded-full border border-rose-200/40 animate-pulse"></div>
          <div className="w-40 h-40 rounded-full border border-rose-200/20"></div>
          <div className="w-24 h-24 rounded-full border border-rose-300/30"></div>
        </div>

        {/* Dynamic Scan Center */}
        <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
          {/* Animated pulsing wave */}
          {radarScanning && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 bg-rose-400 rounded-full"
              ></motion.div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 bg-rose-400 rounded-full"
              ></motion.div>
            </>
          )}

          {/* Central radar circle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={triggerRadarScan}
            disabled={radarScanning}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-white font-bold z-10 shadow-lg cursor-pointer ${
              radarScanning ? 'bg-rose-400' : 'bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
            }`}
          >
            <Compass className={`w-5 h-5 ${radarScanning ? 'animate-spin' : ''}`} />
            <span className="text-[8px] tracking-wide mt-0.5">SCAN</span>
          </motion.button>
        </div>

        <p className="text-[10px] text-zinc-500 text-center font-semibold z-10 max-w-[250px]">
          {radarScanning 
            ? 'Memindai perangkat Dolly terdekat...' 
            : 'Ketuk radar SCAN untuk mencari teman baru di sekitarmu!'}
        </p>
      </div>

      {/* List results of Nearby People */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        <h3 className="text-[10.5px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
          <ArrowUpDown className="w-3 h-3 mr-1" />
          Urut Berdasarkan Jarak Terdekat ({filteredPeople.length} Orang)
        </h3>

        <div className="space-y-2.5">
          {filteredPeople.map((person) => {
            const hasWaved = wavedIds.includes(person.id);

            return (
              <motion.div
                layout
                key={person.id}
                className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-start justify-between hover:border-rose-100 transition-colors"
              >
                {/* User Description Info */}
                <div 
                  className="flex items-start space-x-3 min-w-0 cursor-pointer group"
                  onClick={() => onViewProfile(person.id)}
                >
                  <div className="relative w-11 h-11 shrink-0 mt-0.5_">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full border border-zinc-100 group-hover:scale-105 transition-transform duration-200"
                    />
                    {person.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>

                  <div className="min-w-0 text-left">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-xs font-bold text-zinc-800 leading-tight group-hover:text-rose-500 transition-colors">
                        {person.name}
                      </span>
                      <span className={`text-[8.5px] font-black text-white px-1.5 py-0.2 rounded-full flex items-center shrink-0 ${
                        person.gender === 'Perempuan' ? 'bg-pink-400' : 'bg-blue-400'
                      }`}>
                        {person.gender === 'Perempuan' ? '♀' : '♂'} {person.age}
                      </span>
                    </div>

                    <span className="text-[10px] text-rose-500 font-extrabold mr-1 bg-rose-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                      {person.distance}
                    </span>

                    <p className="text-[10px] text-zinc-500 font-medium line-clamp-1 mt-1 leading-relaxed">
                      &quot;{person.statusMessage || person.bio}&quot;
                    </p>
                  </div>
                </div>

                {/* Sapa wave and direct messages buttons */}
                <div className="flex flex-col space-y-1.5 shrink-0 ml-2">
                  {/* Sapa Wave button */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleWave(person.id)}
                    className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-full text-[9px] font-bold shadow-sm transition-all duration-200 ${
                      hasWaved
                        ? 'bg-zinc-100 text-zinc-400 cursor-default'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-100'
                    }`}
                  >
                    {hasWaved ? (
                      <>
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        <span>Tersapa</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs">👋</span>
                        <span>Sapa</span>
                      </>
                    )}
                  </motion.button>

                  {/* Direct chat button */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onOpenChat(person.id)}
                    className="flex items-center justify-center space-x-1 border border-zinc-200 hover:border-rose-300 hover:bg-rose-50 text-zinc-500 hover:text-rose-500 px-3 py-1.5 rounded-full text-[9px] font-bold transition-all"
                  >
                    <MessageSquare className="w-2.5 h-2.5" />
                    <span>Obrolin</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
