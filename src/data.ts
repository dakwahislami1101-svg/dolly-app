/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person, Status, FriendRequest, Message, Chat } from './types';

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'aisha',
    name: 'Aisha',
    age: 23,
    distance: '1.1 km',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Perempuan',
    bio: 'Menyukai sore hari, kopi senja, dan hunting foto estetis ☕📸',
    statusMessage: 'Nongkrong santai yuk..'
  },
  {
    id: 'ben',
    name: 'Ben',
    age: 25,
    distance: '0.8 km',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Laki-laki',
    bio: 'Pecinta olahraga pagi, gym, dan gaya hidup sehat 💪🏃‍♂️',
    statusMessage: 'Gym time! No pain no gain'
  },
  {
    id: 'chandra',
    name: 'Chandra',
    age: 24,
    distance: '1.4 km',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Laki-laki',
    bio: 'Suka coding, dengerin musik indie, dan keliling kota malam hari 🏍️🎧',
    statusMessage: 'Mencari teman diskusi seru'
  },
  {
    id: 'dini',
    name: 'Dini',
    age: 22,
    distance: '1.0 km',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Perempuan',
    bio: 'Pencinta kuliner pedas, bakso mercon, dan nonton film drakor 🍜🎬',
    statusMessage: 'Lagi BM bakso pedes nih...'
  },
  {
    id: 'eko',
    name: 'Eko',
    age: 26,
    distance: '1.5 km',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Laki-laki',
    bio: 'Pecinta alam, naik gunung, dan kopi tubruk ireng 🗻☕',
    statusMessage: 'Rindu dinginnya puncak gunung'
  },
  {
    id: 'fiona',
    name: 'Fiona',
    age: 23,
    distance: '0.9 km',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Perempuan',
    bio: 'Desainer grafis yang hobi menggambar kucing dan minum boba 🧋🐱',
    statusMessage: 'Drawing all night'
  },
  {
    id: 'leo',
    name: 'Leo',
    age: 24,
    distance: '2.1 km',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Laki-laki',
    bio: 'Gamer kasual, seneng mabar ML atau PUBG, gass push rank! 🎮🔥',
    statusMessage: 'Ready mabar, chat aja'
  },
  {
    id: 'maya',
    name: 'Maya',
    age: 24,
    distance: '1.8 km',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Perempuan',
    bio: 'Suka travelling, koleksi tanaman hias daun, dan baca novel fiksi 🌿✈️',
    statusMessage: 'Keep calm and plant more'
  },
  {
    id: 'sarah',
    name: 'Sarah',
    age: 25,
    distance: '0.5 km',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    online: true,
    gender: 'Perempuan',
    bio: 'Pecandu buku, kerja di agensi kreatif, kopi hitam no sugar ☕💼',
    statusMessage: 'Chasing deadlines'
  }
];

export const INITIAL_FRIENDS: Person[] = [
  INITIAL_PEOPLE.find(p => p.id === 'leo')!,
  INITIAL_PEOPLE.find(p => p.id === 'maya')!,
  INITIAL_PEOPLE.find(p => p.id === 'sarah')!
];

export const INITIAL_REQUESTS: FriendRequest[] = [
  {
    id: 'req_rio',
    personId: 'rio',
    name: 'Rio',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200',
    status: 'pending'
  },
  {
    id: 'req_dina',
    personId: 'dina',
    name: 'Dina',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200&h=200',
    status: 'pending'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  // Chat with Leo (unread)
  {
    id: 'msg_l1',
    senderId: 'leo',
    text: 'Halo bro, nanti malam jadi ketemuan main game ga?',
    timestamp: '17:32',
    unread: true
  },
  // Chat with Aisha (unread)
  {
    id: 'msg_a1',
    senderId: 'aisha',
    text: 'Hai! Wah salam kenal ya. Kamu tinggal di deket sini juga?',
    timestamp: '16:15',
    unread: true
  },
  // Chat with Maya (unread)
  {
    id: 'msg_m1',
    senderId: 'maya',
    text: 'P',
    timestamp: '15:10',
    unread: true
  },
  {
    id: 'msg_m2',
    senderId: 'maya',
    text: 'Eh besok ada acara ga? Mau diajak nongkrong bareng Sarah nih.',
    timestamp: '15:11',
    unread: true
  },
  // Chat with Sarah (unread)
  {
    id: 'msg_s1',
    senderId: 'sarah',
    text: 'Wah iya betul, menarik banget tuh ide proyeknya. Nanti dikabarin lagi ya.',
    timestamp: '14:45',
    unread: true
  },
  // Chat with Ben (read, previously talked)
  {
    id: 'msg_b1',
    senderId: 'ben',
    text: 'Yoo bro! Besok pagi lari sehat yuk di lapangan biasa jam 6.',
    timestamp: 'Kemarin',
    unread: false
  },
  {
    id: 'msg_b2',
    senderId: 'me',
    text: 'Boleh juga tuh, kabarin aja nanti kalau udah di lokasi ya.',
    timestamp: 'Kemarin',
    unread: false
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'leo',
    personId: 'leo',
    lastMessage: 'Halo bro, nanti malam jadi ketemuan main game ga?',
    timestamp: '17:32',
    unreadCount: 1
  },
  {
    id: 'aisha',
    personId: 'aisha',
    lastMessage: 'Hai! Wah salam kenal ya. Kamu tinggal di deket sini?',
    timestamp: '16:15',
    unreadCount: 1
  },
  {
    id: 'maya',
    personId: 'maya',
    lastMessage: 'Eh besok ada acara ga? Mau nongkrong...',
    timestamp: '15:11',
    unreadCount: 2
  },
  {
    id: 'sarah',
    personId: 'sarah',
    lastMessage: 'Wah iya betul, menarik banget tuh...',
    timestamp: '14:45',
    unreadCount: 1
  },
  {
    id: 'ben',
    personId: 'ben',
    lastMessage: 'Boleh juga tuh, kabarin aja nanti...',
    timestamp: 'Kemarin',
    unreadCount: 0
  }
];

export const INITIAL_STATUSES: Status[] = [
  {
    id: 'st_aisha',
    personId: 'aisha',
    authorName: 'Aisha',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    text: 'Sore-sore gini enaknya nongkrong di cafe deket sini sambil dengerin musik senja 🌆☕ Ada yang mau join untuk sekadar ngobrol santai?',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600&h=400',
    timestamp: '30 menit yang lalu',
    likes: ['Maya', 'Chandra'],
    comments: [
      {
        id: 'c1',
        authorName: 'Chandra',
        text: 'Wah asik tuh, cafe mana tuh ais?',
        timestamp: '20 menit yang lalu'
      },
      {
        id: 'c2',
        authorName: 'Aisha',
        text: '@Chandra cafe yang deket pertigaan jalan raya itu lho, tempatnya estetik parah!',
        timestamp: '15 menit yang lalu'
      }
    ]
  },
  {
    id: 'st_ben',
    personId: 'ben',
    authorName: 'Ben',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    text: 'Selesai 10K running sore hari ini! Konsistensi adalah kunci. Mari olahraga biar imun kuat 💪🏃‍♂️ #HealthyLife #JoggingTime',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600&h=400',
    timestamp: '1 jam yang lalu',
    likes: ['Eko', 'Leo'],
    comments: [
      {
        id: 'c3',
        authorName: 'Eko',
        text: 'Mantap bang, badannya makin jadi aja nih wkwk',
        timestamp: '45 menit yang lalu'
      }
    ]
  },
  {
    id: 'st_dini',
    personId: 'dini',
    authorName: 'Dini',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    text: 'Cuaca dingin-dingin begini emang paling bener makan bakso urat super pedes berkuah merah merona 🍜🌶️ Lidah auto bergoyang, keringat bercucuran! Nikmat mana yang kau dustakan wkwk',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=600&h=400',
    timestamp: '2 jam yang lalu',
    likes: ['Sarah', 'Aisha', 'Maya'],
    comments: [
      {
        id: 'c4',
        authorName: 'Maya',
        text: 'Duhh ngiler banget dini! Share lokasinya dong mumpung laper nih',
        timestamp: '1 jam yang lalu'
      }
    ]
  }
];

// Contextual reply generator based on sender and keywords
export function getSmartReply(personId: string, userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (personId === 'aisha') {
    if (msg.includes('halo') || msg.includes('hai') || msg.includes('salam')) {
      return 'Hai juga! Salam kenal ya 😊 lagi sibuk apa nih sore-sore gini?';
    }
    if (msg.includes('lokasi') || msg.includes('dimana') || msg.includes('tinggal') || msg.includes('deket')) {
      return 'Aku tinggal di deket area sini kok, sekitar jalan Mawar. Kalau kamu daerah mana? Deket juga ga?';
    }
    if (msg.includes('nongkrong') || msg.includes('cafe') || msg.includes('jalan') || msg.includes('yuk')) {
      return 'Wah mau banget! Aku lagi luang nih, ada rekomendasi tempat ngopi yang asik ga?';
    }
    if (msg.includes('umur') || msg.includes('aktifitas' ) || msg.includes('sibuk')) {
      return 'Aku umur 23 tahun, sekarang lagi sibuk freelancing aja nih sambil ngulik hobi foto. Kalau kamu?';
    }
    return 'Wah, menarik banget! Hehe. Ceritain lebih banyak dong tentang kamu, atau mau cari tempat ngopi bareng? ☕';
  }

  if (personId === 'ben') {
    if (msg.includes('halo') || msg.includes('hai') || msg.includes('bro')) {
      return 'Yoo bro! Salam kenal. Gimana kabar? Sehat kan? 💪';
    }
    if (msg.includes('lari') || msg.includes('olahraga') || msg.includes('gym')) {
      return 'Keren! Aku emang hobi banget olahraga. Biasa lari pagi/sore atau nge-gym. Mau bareng kapan-kapan?';
    }
    if (msg.includes('gabung') || msg.includes('yuk') || msg.includes('main')) {
      return 'Gass bro! Atur waktu aja, ntar kabarin ya biar bisa sinkron jadwalnya.';
    }
    return 'Keren dapet kabar dari kamu. Tetap semangat ya bro, jangan lupa jaga kesehatan! 👍🔥';
  }

  if (personId === 'leo') {
    if (msg.includes('mabar') || msg.includes('game') || msg.includes('ml') || msg.includes('pubg')) {
      return 'GASS MABAR! ID ML-ku: DollyLeoGamer, add ya ntar kita push rank bareng. Udah masuk tier apa?';
    }
    if (msg.includes('nanti') || msg.includes('malam') || msg.includes('bisa')) {
      return 'Siap, jam 8-an malam ya. Aku login Discord juga ntar biar mabar-nya makin dapet chemistry!';
    }
    return 'Hahaha okee bro! Pokoknya info aja kalau udah ready mabar, akunku aktif terus kok 🎮😎';
  }

  if (personId === 'maya') {
    if (msg.includes('nongkrong') || msg.includes('sarah') || msg.includes('besok')) {
      return 'Iya nih, kita rencana besok jam 4 sore mau nyobain kue cubit hits deket taman kota. Ikutan yuk biar rame!';
    }
    if (msg.includes('p') || msg.includes('halo') || msg.includes('hai')) {
      return 'Haiii! Maaf ya tadi cuma nge-P hehe. Lagi senggang ga hari ini?';
    }
    return 'Wkwkwk okey okee, ntar kalau positif ikut langsung kabarin aku atau Sarah yaa 🌿🌸';
  }

  if (personId === 'sarah') {
    if (msg.includes('proyek') || msg.includes('kerja') || msg.includes('ide')) {
      return 'Iya, konsepnya dapet banget. Aku rasa kita bisa kombinasiin sama campaign kreatif minggu depan. Senggang kapan buat bahas detail?';
    }
    return 'Baik, terima kasih ya atas responnya. Nanti diskusi lebih lanjut ya, lagi agak hektik dengan deadline kantor nih 💼💻';
  }

  if (personId === 'dini') {
    if (msg.includes('bakso') || msg.includes('mercon') || msg.includes('pedes') || msg.includes('makan')) {
      return 'Aduhh baksonya mantep banget kak! Di warung Bakso Joyo belakang pos ronda. Harus coba sih penikmat cabe wkwk';
    }
    return 'Salam kenal ya! Aku suka banget kulineran, kalau ada info tempat makanan enak infoin aku ya! 🍜😋';
  }

  // Fallback default message based on user name
  return 'Wah seru dapet chat dari kamu! Salam kenal ya. Aku senang bisa ngobrol bareng di Dolly. Lagi ngapain nih? 😊✨';
}
