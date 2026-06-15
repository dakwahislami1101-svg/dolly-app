/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { HomeTab } from './components/HomeTab';
import { ChatTab } from './components/ChatTab';
import { ChatRoom } from './components/ChatRoom';
import { NearMeTab } from './components/NearMeTab';
import { MomentsTab } from './components/MomentsTab';
import { ProfileTab } from './components/ProfileTab';
import { AuthScreen } from './components/AuthScreen';

import {
  Home,
  MessageCircle,
  Compass,
  Flame,
  User,
  Sparkles,
  Info
} from 'lucide-react';

import { Person, Chat, Message, Status, FriendRequest } from './types';
import {
  INITIAL_PEOPLE,
  INITIAL_FRIENDS,
  INITIAL_REQUESTS,
  INITIAL_MESSAGES,
  INITIAL_CHATS,
  INITIAL_STATUSES
} from './data';

import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { auth, db, logInWithGoogle, logOutUser, handleFirestoreError, OperationType, validateConnection } from './lib/firebase';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'near-me' | 'moments' | 'profile'>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // States
  const [people, setPeople] = useState<Person[]>([]);
  const [friends, setFriends] = useState<Person[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  
  const [myProfile, setMyProfile] = useState({
    name: 'Dolly User',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Heii! Desainer yang hobi kulineran & meetup teman baru di Dolly! ✨'
  });

  // Action toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'normal' } | null>(null);
  const [user, setUser] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'normal' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Firebase auth & connection validation bootstrap
  useEffect(() => {
    validateConnection();

    // Recover Guest Session state automatically
    const isGuestActive = sessionStorage.getItem('dolly_guest_active') === 'true';
    if (isGuestActive) {
      setUser({
        uid: 'guest_user',
        email: 'guest@dolly.web.id',
        displayName: 'Tamu Dolly',
        isAnonymous: true,
        emailVerified: true
      });
      const localProfile = localStorage.getItem('dolly_profile');
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          if (parsed && parsed.name) {
            setMyProfile(parsed);
          }
        } catch (e) {
          console.warn('Profile guest load error:', e);
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Guard active Guest session from auth override
      if (sessionStorage.getItem('dolly_guest_active') === 'true') {
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        showToast(`Terhubung ke database cloud! 👋`, 'success');
        
        // Load or initialize user profile
        try {
          const profRef = doc(db, 'profiles', firebaseUser.uid);
          const profSnap = await getDoc(profRef);
          if (!profSnap.exists()) {
            const initialProf = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Dolly User',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
              bio: 'Heii! Desainer yang hobi kulineran & meetup teman baru di Dolly! ✨',
              gender: 'Laki-laki' as const,
              online: true,
              distance: '0.0 km',
              statusMessage: 'Terhubung ke database cloud!'
            };
            await setDoc(profRef, initialProf);
            setMyProfile({ name: initialProf.name, avatar: initialProf.avatar, bio: initialProf.bio });
          } else {
            const data = profSnap.data();
            setMyProfile({
              name: data.name || 'Dolly User',
              avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
              bio: data.bio || ''
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `profiles/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync people and profiles from Firestore in real-time online
  useEffect(() => {
    if (!user || user.uid === 'guest_user') return;

    const unsubscribe = onSnapshot(collection(db, 'profiles'), async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const p of INITIAL_PEOPLE) {
            await setDoc(doc(db, 'profiles', p.id), {
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              bio: p.bio,
              gender: p.gender,
              online: p.online,
              distance: p.distance,
              statusMessage: p.statusMessage || ''
            });
          }
        } catch (err) {
          console.error('Failed to seed profiles:', err);
        }
      } else {
        const peopleList: Person[] = [];
        snapshot.docs.forEach((dSnap) => {
          const data = dSnap.data();
          if (data.id === user.uid) return;
          peopleList.push({
            id: data.id,
            name: data.name || 'Dolly User',
            age: data.age || 24,
            distance: data.distance || '1.2 km',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
            online: data.online ?? true,
            gender: data.gender || 'Laki-laki',
            bio: data.bio || 'Halo! Salam kenal ya 😊',
            statusMessage: data.statusMessage || ''
          });
        });
        setPeople(peopleList);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'profiles');
    });

    return () => unsubscribe();
  }, [user]);

  // Sync statuses/moments from Firestore in real-time online
  useEffect(() => {
    if (!user || user.uid === 'guest_user') return;

    const unsubscribe = onSnapshot(collection(db, 'statuses'), async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const st of INITIAL_STATUSES) {
            const finalPersonId = st.personId === 'me' ? user.uid : st.personId;
            const finalAuthorName = st.personId === 'me' ? myProfile.name : st.authorName;
            const finalAuthorAvatar = st.personId === 'me' ? myProfile.avatar : st.authorAvatar;

            await setDoc(doc(db, 'statuses', st.id), {
              id: st.id,
              personId: finalPersonId,
              authorName: finalAuthorName,
              authorAvatar: finalAuthorAvatar,
              text: st.text,
              image: st.image || '',
              likes: st.likes || []
            });

            for (const cm of st.comments) {
              await setDoc(doc(db, 'statuses', st.id, 'comments', cm.id), {
                id: cm.id,
                authorName: cm.authorName,
                text: cm.text,
                createdAt: cm.timestamp
              });
            }
          }
        } catch (err) {
          console.error('Failed to seed statuses:', err);
        }
      } else {
        const statusesList: Status[] = [];
        for (const dSnap of snapshot.docs) {
          const data = dSnap.data();
          let commentsList: any[] = [];
          try {
            const comsSnap = await getDocs(collection(db, 'statuses', dSnap.id, 'comments'));
            commentsList = comsSnap.docs.map(cd => cd.data());
          } catch (e) {
            console.warn('Comments fetch err:', e);
          }

          statusesList.push({
            id: dSnap.id,
            personId: data.personId === user.uid ? 'me' : data.personId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            text: data.text,
            image: data.image || undefined,
            timestamp: 'Kemarin',
            likes: data.likes || [],
            comments: commentsList.map(c => ({
              id: c.id,
              authorName: c.authorName,
              text: c.text,
              timestamp: c.createdAt
            }))
          });
        }
        setStatuses(statusesList);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'statuses');
    });

    return () => unsubscribe();
  }, [user, myProfile.name]);

  // Sync requests from Firestore online
  useEffect(() => {
    if (!user || user.uid === 'guest_user') return;

    const unsubscribe = onSnapshot(collection(db, 'requests'), (snapshot) => {
      if (snapshot.empty) {
        try {
          INITIAL_REQUESTS.forEach((req) => {
            setDoc(doc(db, 'requests', req.id), {
              id: req.id,
              personId: req.personId,
              name: req.name,
              age: req.age,
              avatar: req.avatar,
              status: req.status
            });
          });
        } catch (err) {
          console.error('Failed to seed requests:', err);
        }
      } else {
        const reqList: FriendRequest[] = [];
        snapshot.docs.forEach((dSnap) => {
          const data = dSnap.data();
          reqList.push({
            id: dSnap.id,
            personId: data.personId,
            name: data.name,
            age: data.age || 22,
            avatar: data.avatar,
            status: data.status as 'pending' | 'accepted' | 'rejected'
          });
        });
        setRequests(reqList);

        const acceptedRequests = reqList.filter(r => r.status === 'accepted');
        const friendsList: Person[] = [];
        acceptedRequests.forEach(r => {
          const friendObj = INITIAL_PEOPLE.find(p => p.id === r.personId) || people.find(p => p.id === r.personId);
          if (friendObj) {
            friendsList.push(friendObj);
          } else {
            friendsList.push({
              id: r.personId,
              name: r.name,
              age: r.age,
              distance: '1.0 km',
              avatar: r.avatar,
              online: true,
              gender: 'Laki-laki',
              bio: 'Halo! Salam kenal ya 😊',
              statusMessage: 'Ready to chat!'
            });
          }
        });
        const defaultFriends = INITIAL_FRIENDS.filter(df => !friendsList.some(f => f.id === df.id));
        setFriends([...friendsList, ...defaultFriends]);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'requests');
    });

    return () => unsubscribe();
  }, [user, people]);

  // Sync Chats from Firestore online
  useEffect(() => {
    if (!user || user.uid === 'guest_user') return;

    const unsubscribe = onSnapshot(collection(db, 'chats'), (snapshot) => {
      if (snapshot.empty) {
        try {
          INITIAL_CHATS.forEach((ch) => {
            setDoc(doc(db, 'chats', ch.id), {
              id: ch.id,
              personId: ch.personId,
              lastMessage: ch.lastMessage,
              timestamp: ch.timestamp,
              unreadCount: ch.unreadCount
            });
          });
        } catch (e) {
          console.error('Failed to seed chats:', e);
        }
      } else {
        const chatsList: Chat[] = [];
        snapshot.docs.forEach((dSnap) => {
          const data = dSnap.data();
          chatsList.push({
            id: dSnap.id,
            personId: data.personId,
            lastMessage: data.lastMessage,
            timestamp: data.timestamp,
            unreadCount: data.unreadCount || 0
          });
        });
        setChats(chatsList);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Messages from Firestore online
  useEffect(() => {
    if (!user || !activeChatId || user.uid === 'guest_user') return;

    const q = query(collection(db, 'chats', activeChatId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        try {
          const contactMsg = INITIAL_MESSAGES.filter(m => m.senderId === activeChatId || (m.senderId === 'me' && activeChatId === 'ben'));
          contactMsg.forEach((m) => {
            setDoc(doc(db, 'chats', activeChatId, 'messages', m.id), {
              id: m.id,
              senderId: m.senderId,
              text: m.text,
              timestamp: m.timestamp,
              unread: m.unread || false,
              type: m.type || 'text',
              mediaUrl: m.mediaUrl || ''
            });
          });
        } catch (e) {
          console.error('Failed to seed messages:', e);
        }
      } else {
        const msgs: Message[] = [];
        snapshot.docs.forEach((dSnap) => {
          const data = dSnap.data();
          msgs.push({
            id: dSnap.id,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp,
            unread: data.unread || false,
            type: data.type || 'text',
            mediaUrl: data.mediaUrl || ''
          });
        });
        setMessages((prev) => {
          const otherMsgs = prev.filter(m => m.senderId !== activeChatId && m.senderId !== 'me');
          return [...otherMsgs, ...msgs].sort((a,b) => a.id.localeCompare(b.id));
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `chats/${activeChatId}/messages`);
    });

    return () => unsubscribe();
  }, [user, activeChatId]);

  // Auth logins Google
  const handleGoogleLogin = async () => {
    try {
      await logInWithGoogle();
    } catch (e) {
      showToast('Gagal masuk dengan Google.', 'normal');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      sessionStorage.removeItem('dolly_guest_active');
      await logOutUser();
      showToast('Berhasil keluar dari Cloud.', 'info');
      // reload to clear states
      window.location.reload();
    } catch (e) {
      showToast('Gagal keluar.', 'normal');
    }
  };

  // Load state from LocalStorage on mount
  useEffect(() => {
    if (user) return;
    const localPeople = localStorage.getItem('dolly_people');
    const localFriends = localStorage.getItem('dolly_friends');
    const localRequests = localStorage.getItem('dolly_requests');
    const localMessages = localStorage.getItem('dolly_messages');
    const localChats = localStorage.getItem('dolly_chats');
    const localStatuses = localStorage.getItem('dolly_statuses');
    const localProfile = localStorage.getItem('dolly_profile');

    const tryParse = <T,>(value: string | null, fallback: T): T => {
      if (!value) return fallback;
      try {
        const parsed = JSON.parse(value);
        if (parsed === undefined || parsed === null) return fallback;
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed as T;
      } catch (e) {
        console.warn('Dolly recovery parse error:', e);
        return fallback;
      }
    };

    setPeople(tryParse(localPeople, INITIAL_PEOPLE));
    setFriends(tryParse(localFriends, INITIAL_FRIENDS));
    setRequests(tryParse(localRequests, INITIAL_REQUESTS));
    setMessages(tryParse(localMessages, INITIAL_MESSAGES));
    setChats(tryParse(localChats, INITIAL_CHATS));
    setStatuses(tryParse(localStatuses, INITIAL_STATUSES));

    if (localProfile) {
      try {
        const parsedProfile = JSON.parse(localProfile);
        if (parsedProfile && parsedProfile.name && parsedProfile.avatar) {
          setMyProfile(parsedProfile);
        }
      } catch (e) {
        console.warn('Profile recovery error:', e);
      }
    }
  }, []);

  // Sync to LocalStorage on updates
  useEffect(() => {
    if (people.length > 0) localStorage.setItem('dolly_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    if (friends.length > 0) localStorage.setItem('dolly_friends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('dolly_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('dolly_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (chats.length > 0) localStorage.setItem('dolly_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (statuses.length > 0) localStorage.setItem('dolly_statuses', JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem('dolly_profile', JSON.stringify(myProfile));
  }, [myProfile]);

  // Friend Request Accepted handler
  const handleAcceptRequest = async (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    if (user && user.uid !== 'guest_user') {
      try {
        await updateDoc(doc(db, 'requests', requestId), { status: 'accepted' });
        const greetingMsgId = `msg_hello_${Date.now()}`;
        await setDoc(doc(db, 'chats', request.personId), {
          id: request.personId,
          personId: request.personId,
          lastMessage: `Terima kasih atas pertemanannya!`,
          timestamp: 'Baru saja',
          unreadCount: 1
        });
        await setDoc(doc(db, 'chats', request.personId, 'messages', greetingMsgId), {
          id: greetingMsgId,
          senderId: request.personId,
          text: `Halo, terima kasih ya udah terima permintaan pertemananku! Salam kenal dari ${request.name}! 👋`,
          timestamp: 'Baru saja',
          unread: true,
          type: 'text'
        });
        showToast(`${request.name} sekarang berteman dengan kamu! Sapa dia sekarang!`, 'success');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requests/${requestId}`);
      }
    }

    // 1. Move into Friends
    const alreadyFriend = friends.some((f) => f.id === request.personId);
    let friendObj = people.find((p) => p.id === request.personId);

    // If person does not exist in seed people pool, create them
    if (!friendObj) {
      friendObj = {
        id: request.personId,
        name: request.name,
        age: request.age,
        distance: '0.5 km',
        avatar: request.avatar,
        online: true,
        gender: 'Perempuan',
        bio: 'Halo! Salam kenal ya 😊',
        statusMessage: 'Ready to chat!'
      };
      setPeople((prev) => [...prev, friendObj!]);
    }

    if (!alreadyFriend) {
      setFriends((prev) => [...prev, friendObj!]);
    }

    // 2. Remove request from list
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    // 3. Create initial greeting message and chat item
    const greetingMsg: Message = {
      id: `msg_hello_${Date.now()}`,
      senderId: request.personId,
      text: `Halo, terima kasih ya udah terima permintaan pertemananku! Salam kenal dari ${request.name}! 👋`,
      timestamp: 'Baru saja',
      unread: true
    };

    setMessages((prev) => [...prev, greetingMsg]);

    const newChat: Chat = {
      id: request.personId,
      personId: request.personId,
      lastMessage: `Terima kasih atas pertemanannya!`,
      timestamp: 'Baru saja',
      unreadCount: 1
    };

    setChats((prev) => {
      const exists = prev.some((c) => c.id === request.personId);
      if (exists) {
        return prev.map((c) =>
          c.id === request.personId
            ? { ...c, lastMessage: greetingMsg.text, timestamp: 'Baru saja', unreadCount: c.unreadCount + 1 }
            : c
        );
      }
      return [newChat, ...prev];
    });

    showToast(`${request.name} sekarang berteman dengan kamu! Sapa dia sekarang!`, 'success');
  };

  // Friend Request Rejected handler
  const handleRejectRequest = async (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (user && user.uid !== 'guest_user') {
      try {
        await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
        showToast('Permintaan pertemanan ditolak.', 'normal');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requests/${requestId}`);
      }
    }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (request) {
      showToast(`Permintaan pertemanan ${request.name} ditolak.`, 'normal');
    }
  };

  // Open active chat room
  const handleOpenChat = (personId: string) => {
    setActiveChatId(personId);
    
    // Clear unread counts for this chat
    setChats(prev => prev.map(chat => 
      chat.personId === personId 
        ? { ...chat, unreadCount: 0 } 
        : chat
    ));

    // Clear unread flag for messages in memory
    setMessages(prev => prev.map(msg => 
      msg.senderId === personId 
        ? { ...msg, unread: false } 
        : msg
    ));
  };

  // Send message handler inside ChatRoom
  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string) => {
    if (!activeChatId) return;

    const timeString = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (user && user.uid !== 'guest_user') {
      try {
        const newMsgPayload = {
          id: msgId,
          senderId: mediaUrl ? activeChatId : 'me',
          text: type === 'text' ? text : type === 'image' ? 'Mengirim foto...' : 'Pesan suara',
          timestamp: timeString,
          unread: false,
          type,
          mediaUrl: mediaUrl || ''
        };

        if (mediaUrl && !text.startsWith('Mengirim') && !text.startsWith('Pesan suara')) {
          newMsgPayload.senderId = activeChatId;
        }

        await setDoc(doc(db, 'chats', activeChatId, 'messages', msgId), newMsgPayload);

        const lastText = type === 'image' ? '📷 Foto' : type === 'voice' ? '🎙️ Pesan Suara' : text;
        await setDoc(doc(db, 'chats', activeChatId), {
          id: activeChatId,
          personId: activeChatId,
          lastMessage: lastText,
          timestamp: timeString,
          unreadCount: 0
        });
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}`);
      }
    }

    const newMsg: Message = {
      id: msgId,
      senderId: mediaUrl ? activeChatId : 'me', // if mediaUrl comes from simulation it might be the sender
      text: type === 'text' ? text : type === 'image' ? 'Mengirim foto...' : 'Pesan suara',
      timestamp: timeString,
      unread: false,
      type,
      mediaUrl
    };

    // If simulating incoming sender reply
    if (mediaUrl && !text.startsWith('Mengirim') && !text.startsWith('Pesan suara')) {
      newMsg.senderId = activeChatId;
    }

    setMessages((prev) => [...prev, newMsg]);

    // Update or insert chat row
    setChats((prev) => {
      const exists = prev.some((c) => c.personId === activeChatId);
      const isMyMessage = newMsg.senderId === 'me';
      
      const lastText = 
        type === 'image' 
          ? '📷 Foto' 
          : type === 'voice' 
            ? '🎙️ Pesan Suara' 
            : text;

      if (exists) {
        return prev.map((c) =>
          c.personId === activeChatId
            ? {
                ...c,
                lastMessage: lastText,
                timestamp: timeString,
                unreadCount: isMyMessage ? 0 : c.unreadCount + 1
              }
            : c
        );
      } else {
        return [
          {
            id: activeChatId,
            personId: activeChatId,
            lastMessage: lastText,
            timestamp: timeString,
            unreadCount: isMyMessage ? 0 : 1
          },
          ...prev
        ];
      }
    });
  };

  // Sapa/Wave Wave sender handler inside NearMeTab
  const handleSendWave = async (personId: string) => {
    const targetPerson = people.find(p => p.id === personId);
    if (!targetPerson) return;

    showToast(`Melambaikan tangan ke ${targetPerson.name}! 👋`, 'info');

    if (user && user.uid !== 'guest_user') {
      try {
        const reqId = `req_${personId}_${Date.now()}`;
        await setDoc(doc(db, 'requests', reqId), {
          id: reqId,
          personId: personId,
          name: targetPerson.name,
          age: targetPerson.age,
          avatar: targetPerson.avatar,
          status: 'pending'
        });

        setTimeout(async () => {
          try {
            const timeString = new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            });

            await updateDoc(doc(db, 'requests', reqId), { status: 'accepted' });

            const replyMsgId = `msg_wave_reply_${Date.now()}`;
            await setDoc(doc(db, 'chats', personId), {
              id: personId,
              personId: personId,
              lastMessage: `Hai! Makasih ya udah sapa aku lambaian tangan. Hehe 😊`,
              timestamp: timeString,
              unreadCount: 1
            });

            await setDoc(doc(db, 'chats', personId, 'messages', replyMsgId), {
              id: replyMsgId,
              senderId: personId,
              text: `Hai! Makasih ya udah sapa aku lambaian tangan. Hehe 😊 ada apa nih? Salam kenal ya!`,
              timestamp: timeString,
              unread: true,
              type: 'text'
            });

            showToast(`Menerima balasan sapaan dari ${targetPerson.name}! 💬`, 'success');
          } catch (e) {
            console.error('Failed to simulate reply:', e);
          }
        }, 3200);
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'requests');
      }
    }

    // Simulate automatic greeting reply in chats after 3.2 seconds
    setTimeout(() => {
      const timeString = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Insert incoming greeting in messages
      const replyMsg: Message = {
        id: `msg_wave_reply_${Date.now()}`,
        senderId: personId,
        text: `Hai! Makasih ya udah sapa aku lambaian tangan. Hehe 😊 ada apa nih? Salam kenal ya!`,
        timestamp: timeString,
        unread: true
      };

      setMessages(prev => [...prev, replyMsg]);

      // Add to friends
      const isAlreadyFriend = friends.some(f => f.id === personId);
      if (!isAlreadyFriend) {
        setFriends(prev => [...prev, targetPerson]);
      }

      // Sync active chats list
      setChats(prev => {
        const exists = prev.some(c => c.personId === personId);
        if (exists) {
          return prev.map(c => 
            c.personId === personId 
              ? { ...c, lastMessage: replyMsg.text, timestamp: timeString, unreadCount: c.unreadCount + 1 }
              : c
          );
        }
        return [
          {
            id: personId,
            personId: personId,
            lastMessage: replyMsg.text,
            timestamp: timeString,
            unreadCount: 1
          },
          ...prev
        ];
      });

      showToast(`Menerima balasan sapaan dari ${targetPerson.name}! 💬`, 'success');
    }, 3200);
  };

  // Like Status handler inside MomentsTab
  const handleLikeStatus = async (statusId: string, userName: string) => {
    if (user && user.uid !== 'guest_user') {
      try {
        const targetStatus = statuses.find(s => s.id === statusId);
        if (!targetStatus) return;

        const isLiked = targetStatus.likes.includes(userName);
        const newLikes = isLiked
          ? targetStatus.likes.filter((name) => name !== userName)
          : [...targetStatus.likes, userName];

        await updateDoc(doc(db, 'statuses', statusId), { likes: newLikes });
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `statuses/${statusId}`);
      }
    }

    setStatuses((prev) =>
      prev.map((st) => {
        if (st.id === statusId) {
          const isLiked = st.likes.includes(userName);
          const newLikes = isLiked
            ? st.likes.filter((name) => name !== userName)
            : [...st.likes, userName];
          return { ...st, likes: newLikes };
        }
        return st;
      })
    );
  };

  // Add Comment on status handler inside MomentsTab
  const handleCommentStatus = async (statusId: string, commentText: string) => {
    const commId = `comm_${Date.now()}`;
    const commentObj = {
      id: commId,
      authorName: myProfile.name,
      text: commentText,
      createdAt: 'Baru saja'
    };

    if (user && user.uid !== 'guest_user') {
      try {
        await setDoc(doc(db, 'statuses', statusId, 'comments', commId), commentObj);
        showToast('Komentar berhasil ditambahkan!', 'success');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `statuses/${statusId}/comments/${commId}`);
      }
    }

    const commentObjLocal = {
      id: `comm_${Date.now()}`,
      authorName: myProfile.name,
      text: commentText,
      timestamp: 'Baru saja'
    };

    setStatuses((prev) =>
      prev.map((st) => {
        if (st.id === statusId) {
          return {
            ...st,
            comments: [...st.comments, commentObjLocal]
          };
        }
        return st;
      })
    );

    showToast('Komentar berhasil ditambahkan!', 'success');
  };

  // Create customized Status handler inside MomentsTab
  const handlePostStatus = async (text: string, imageUrl?: string) => {
    if (user && user.uid !== 'guest_user') {
      try {
        const statusId = `status_self_${Date.now()}`;
        await setDoc(doc(db, 'statuses', statusId), {
          id: statusId,
          personId: user.uid,
          authorName: myProfile.name,
          authorAvatar: myProfile.avatar,
          text,
          image: imageUrl || '',
          likes: []
        });
        showToast('Status momen berhasil diposting!', 'success');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'statuses');
      }
    }

    const newStatus: Status = {
      id: `status_self_${Date.now()}`,
      personId: 'me',
      authorName: myProfile.name,
      authorAvatar: myProfile.avatar,
      text,
      image: imageUrl,
      timestamp: 'Baru saja',
      likes: [],
      comments: []
    };

    setStatuses((prev) => [newStatus, ...prev]);
    showToast('Status momen berhasil diposting!', 'success');
  };

  // Edit user custom profile details
  const handleUpdateProfile = async (name: string, bio: string, avatar?: string) => {
    if (user && user.uid !== 'guest_user') {
      try {
        const payload: any = { name, bio };
        if (avatar) payload.avatar = avatar;
        await updateDoc(doc(db, 'profiles', user.uid), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
      }
    }

    setMyProfile((prev) => ({
      ...prev,
      name,
      bio,
      ...(avatar ? { avatar } : {})
    }));
    
    // Also update any self status in moments array
    setStatuses((prev) =>
      prev.map((st) => {
        if (st.personId === 'me') {
          return {
            ...st,
            authorName: name,
            ...(avatar ? { authorAvatar: avatar } : {})
          };
        }
        return st;
      })
    );

    showToast('Profil berhasil disimpan!', 'success');
  };

  // Dynamic calculation of total unread messages count for bubble notification badge
  const totalUnreadChats = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  // Active user details helper
  const chattingPerson = people.find((p) => p.id === activeChatId);

  if (!user) {
    return (
      <MobileFrame>
        {/* Toast Alert Popups UI indicator */}
        {toast && (
          <div className="absolute top-16 left-4 right-4 z-50 pointer-events-none flex items-center justify-center">
            <div className={`p-3 rounded-2xl flex items-center space-x-2 shadow-lg backdrop-blur bg-white/95 border text-xs text-zinc-900 border-zinc-100 font-bold max-w-sm transition-all duration-300 transform scale-100`}>
              {toast.type === 'success' && <span className="text-base text-green-500">✅</span>}
              {toast.type === 'info' && <span className="text-base text-blue-500">👋</span>}
              {toast.type === 'normal' && <span className="text-base text-rose-500">📢</span>}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full">
          <AuthScreen 
            onAuthSuccess={(u) => { 
              if (u?.uid === 'guest_user') { 
                sessionStorage.setItem('dolly_guest_active', 'true'); 
              } 
              setUser(u); 
            }} 
            showToast={showToast} 
          />
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      {/* Toast Alert Popups UI indicator */}
      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 pointer-events-none flex items-center justify-center">
          <div className={`p-3 rounded-2xl flex items-center space-x-2 shadow-lg backdrop-blur bg-white/95 border text-xs text-zinc-900 border-zinc-100 font-bold max-w-sm transition-all duration-300 transform scale-100`}>
            {toast.type === 'success' && <span className="text-base text-green-500">✅</span>}
            {toast.type === 'info' && <span className="text-base text-blue-500">👋</span>}
            {toast.type === 'normal' && <span className="text-base text-rose-500">📢</span>}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Screen layout switches wrapper */}
      <div className="flex-1 overflow-hidden flex flex-col relative w-full">
        {activeChatId && chattingPerson ? (
          // Active chat room covers everything else
          <ChatRoom
            person={chattingPerson}
            messages={messages}
            onBack={() => setActiveChatId(null)}
            onSendMessage={handleSendMessage}
          />
        ) : (
          // Standard Tab Switch layouts
          <>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'home' && (
                <HomeTab
                  people={people}
                  friends={friends}
                  requests={requests}
                  onOpenChat={handleOpenChat}
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
                />
              )}
              {activeTab === 'chat' && (
                <ChatTab
                  chats={chats}
                  people={people}
                  onOpenChat={handleOpenChat}
                />
              )}
              {activeTab === 'near-me' && (
                <NearMeTab
                  people={people}
                  onOpenChat={handleOpenChat}
                  onSendWave={handleSendWave}
                />
              )}
              {activeTab === 'moments' && (
                <MomentsTab
                  statuses={statuses}
                  myProfile={myProfile}
                  onLikeStatus={handleLikeStatus}
                  onCommentStatus={handleCommentStatus}
                  onPostStatus={handlePostStatus}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileTab
                  myProfile={myProfile}
                  myStatuses={statuses.filter((st) => st.personId === 'me')}
                  friendsCount={friends.length}
                  onUpdateProfile={handleUpdateProfile}
                  user={user}
                  onLogin={handleGoogleLogin}
                  onLogout={handleGoogleLogout}
                />
              )}
            </div>

            {/* Bottom Screen Navigation Bar */}
            <div className="bg-white border-t border-zinc-100 flex items-center justify-around py-2.5 px-2 shrink-0 select-none z-30 shadow-md">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center space-y-1 py-1.5 px-3 rounded-xl transition-all ${
                  activeTab === 'home' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Home className="w-5 h-5 fill-current opacity-85" />
                <span className="text-[10px] font-black">Home</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex flex-col items-center space-y-1 py-1.5 px-3 rounded-xl relative transition-all ${
                  activeTab === 'chat' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <div className="relative">
                  <MessageCircle className="w-5 h-5 fill-current opacity-85" />
                  {totalUnreadChats > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white min-w-[15px] h-[15px] rounded-full text-[8.5px] font-black flex items-center justify-center px-1 border border-white">
                      {totalUnreadChats}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black">Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('near-me')}
                className={`flex flex-col items-center space-y-1 py-1.5 px-3 rounded-xl transition-all ${
                  activeTab === 'near-me' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Compass className="w-5 h-5 fill-current opacity-85" />
                <span className="text-[10px] font-black">Near Me</span>
              </button>

              <button
                onClick={() => setActiveTab('moments')}
                className={`flex flex-col items-center space-y-1 py-1.5 px-3 rounded-xl transition-all ${
                  activeTab === 'moments' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Flame className="w-5 h-5 fill-current opacity-85" />
                <span className="text-[10px] font-black">Momen</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center space-y-1 py-1.5 px-3 rounded-xl transition-all ${
                  activeTab === 'profile' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <User className="w-5 h-5 fill-current opacity-85" />
                <span className="text-[10px] font-black">Profile</span>
              </button>
            </div>
          </>
        )}
      </div>
    </MobileFrame>
  );
}
