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
import { motion, AnimatePresence } from 'motion/react';

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
  const [showSplash, setShowSplash] = useState(true);

  // Auto-dismiss Dolly splash screen after 3.8s intro animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

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

  const isLocalMode = !user || 
    user.uid === 'guest_user' || 
    (typeof user.uid === 'string' && user.uid.startsWith('google_user_')) || 
    sessionStorage.getItem('dolly_guest_active') === 'true';

  const showToast = (message: string, type: 'success' | 'info' | 'normal' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Notification banner HUD state
  const [activeSystemNotification, setActiveSystemNotification] = useState<{
    id: string;
    title: string;
    body: string;
    avatar?: string;
    senderId?: string;
  } | null>(null);

  const prevChatsRef = React.useRef<Chat[]>([]);

  // Soundless or chime notification helper
  const triggerSystemPushNotification = (title: string, body: string, avatar?: string, senderId?: string) => {
    // Play a dual-tone synthetic chime matching device alerts natively inside applet
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Note D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // Note A5
      
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.4);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (_) {}

    // Vibrate device if active (120ms burst)
    if ('vibrate' in navigator) {
      navigator.vibrate([120]);
    }

    // Set inside app top banner
    const notifId = String(Date.now());
    setActiveSystemNotification({
      id: notifId,
      title,
      body,
      avatar,
      senderId
    });

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setActiveSystemNotification((current) => (current?.id === notifId ? null : current));
    }, 5000);

    // Request permissions and trigger Native OS desktop alert banners
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const systemNotif = new Notification(title, {
            body,
            icon: '/dolly_logo.jpg',
            tag: senderId || 'dolly-notif'
          });
          systemNotif.onclick = () => {
            window.focus();
            if (senderId) {
              setActiveTab('chat');
              setActiveChatId(senderId);
            }
            systemNotif.close();
          };
        } catch (e) {
          console.warn('Silent local system notification build delay:', e);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    // Direct Capacitor Bridge support trigger automatically
    try {
      const { LocalNotifications } = (window as any).Capacitor?.Plugins || {};
      if (LocalNotifications) {
        LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 10) },
              sound: null,
              attachments: null,
              actionTypeId: "",
              extra: { senderId }
            }
          ]
        });
      }
    } catch (_) {}
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
    if (isLocalMode) return;

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
    if (isLocalMode) return;

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
    if (isLocalMode) return;

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
    if (isLocalMode) return;

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

        // Trigger native notification banner when unread messages increase on Firestore
        if (prevChatsRef.current.length > 0) {
          chatsList.forEach((newC) => {
            const oldC = prevChatsRef.current.find((oc) => oc.id === newC.id);
            if (newC.unreadCount > 0 && (!oldC || oldC.lastMessage !== newC.lastMessage || oldC.unreadCount < newC.unreadCount)) {
              if (activeChatId !== newC.personId) {
                const targetMatch = people.find((p) => p.id === newC.personId);
                triggerSystemPushNotification(
                  targetMatch ? targetMatch.name : 'Dolly Chat',
                  newC.lastMessage,
                  targetMatch?.avatar,
                  newC.personId
                );
              }
            }
          });
        }
        prevChatsRef.current = chatsList;
        setChats(chatsList);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'chats');
    });

    return () => unsubscribe();
  }, [user, activeChatId, people]);

  // Sync Messages from Firestore online
  useEffect(() => {
    if (isLocalMode || !activeChatId) return;

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

    if (!isLocalMode) {
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
    if (!isLocalMode) {
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
  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string, incomingSenderId?: string) => {
    if (!activeChatId) return;

    const timeString = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const effectiveSenderId = incomingSenderId || (mediaUrl ? activeChatId : 'me');

    if (!isLocalMode) {
      try {
        const newMsgPayload = {
          id: msgId,
          senderId: effectiveSenderId,
          text: type === 'text' ? text : type === 'image' ? 'Mengirim foto...' : 'Pesan suara',
          timestamp: timeString,
          unread: incomingSenderId ? true : false,
          type,
          mediaUrl: mediaUrl || ''
        };

        if (mediaUrl && !text.startsWith('Mengirim') && !text.startsWith('Pesan suara')) {
          newMsgPayload.senderId = activeChatId;
        }

        await setDoc(doc(db, 'chats', activeChatId, 'messages', msgId), newMsgPayload);

        const lastText = type === 'image' ? '📷 Foto' : type === 'voice' ? '🎙️ Pesan Suara' : text;
        const isFocusing = activeChatId === text && activeTab === 'chat';
        await setDoc(doc(db, 'chats', activeChatId), {
          id: activeChatId,
          personId: activeChatId,
          lastMessage: lastText,
          timestamp: timeString,
          unreadCount: (incomingSenderId && !isFocusing) ? 1 : 0
        });

        if (incomingSenderId && (activeChatId !== incomingSenderId || activeTab !== 'chat')) {
          const sender = people.find(p => p.id === incomingSenderId);
          triggerSystemPushNotification(
            sender ? sender.name : 'Teman Baru',
            type === 'image' ? '📷 Menyematkan Foto' : type === 'voice' ? '🎙️ Pesan Suara' : text,
            sender?.avatar,
            incomingSenderId
          );
        }
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}`);
      }
    }

    const newMsg: Message = {
      id: msgId,
      senderId: effectiveSenderId,
      text: type === 'text' ? text : type === 'image' ? 'Mengirim foto...' : 'Pesan suara',
      timestamp: timeString,
      unread: incomingSenderId ? true : false,
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

    if (incomingSenderId && (activeChatId !== incomingSenderId || activeTab !== 'chat')) {
      const sender = people.find(p => p.id === incomingSenderId);
      triggerSystemPushNotification(
        sender ? sender.name : 'Teman Baru',
        type === 'image' ? '📷 Menyematkan Foto' : type === 'voice' ? '🎙️ Pesan Suara' : text,
        sender?.avatar,
        incomingSenderId
      );
    }
  };

  // Sapa/Wave Wave sender handler inside NearMeTab
  const handleSendWave = async (personId: string) => {
    const targetPerson = people.find(p => p.id === personId);
    if (!targetPerson) return;

    showToast(`Melambaikan tangan ke ${targetPerson.name}! 👋`, 'info');

    if (!isLocalMode) {
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

            // Trigger notification
            if (activeChatId !== personId || activeTab !== 'chat') {
              triggerSystemPushNotification(
                targetPerson.name,
                `Hai! Makasih ya udah sapa aku lambaian tangan. Hehe 😊 ada apa nih? Salam kenal ya!`,
                targetPerson.avatar,
                personId
              );
            }
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

      // Trigger notification
      if (activeChatId !== personId || activeTab !== 'chat') {
        triggerSystemPushNotification(
          targetPerson.name,
          replyMsg.text,
          targetPerson.avatar,
          personId
        );
      }
    }, 3200);
  };

  // Like Status handler inside MomentsTab
  const handleLikeStatus = async (statusId: string, userName: string) => {
    if (!isLocalMode) {
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

    if (!isLocalMode) {
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
    if (!isLocalMode) {
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

  // Delete status or hide it from the feed
  const handleDeleteStatus = async (statusId: string) => {
    const targetStatus = statuses.find((st) => st.id === statusId);
    if (!targetStatus) return;

    const isOwner = targetStatus.personId === 'me' || (user && targetStatus.personId === user.uid);

    if (isOwner) {
      if (!isLocalMode) {
        try {
          await deleteDoc(doc(db, 'statuses', statusId));
          showToast('Status berhasil dihapus secara permanen!', 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `statuses/${statusId}`);
        }
      } else {
        setStatuses((prev) => prev.filter((st) => st.id !== statusId));
        showToast('Status berhasil dihapus!', 'success');
      }
    } else {
      // Hide from user feed locally
      setStatuses((prev) => prev.filter((st) => st.id !== statusId));
      showToast('Status disembunyikan dari feed Anda! 🙈', 'info');
    }
  };

  // Edit user custom profile details
  const handleUpdateProfile = async (name: string, bio: string, avatar?: string) => {
    if (!isLocalMode) {
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

  if (showSplash) {
    return (
      <MobileFrame>
        <motion.div
          id="dolly_splash_screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShowSplash(false)}
          className="flex-1 w-full h-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex flex-col items-center justify-between py-14 px-6 text-white cursor-pointer select-none relative overflow-hidden"
        >
          {/* Light flare overlay */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />

          {/* Glowing grid effect in background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          {/* Top visual elements */}
          <div className="flex flex-col items-center mt-6">
            <span className="text-[10px] font-black tracking-widest text-white/70 uppercase">
              ✨ Selamat Datang Di Dolly ✨
            </span>
          </div>

          {/* Central Logo and taglines */}
          <div className="flex flex-col items-center justify-center -mt-10">
            {/* Logo wrapper custom ripples */}
            <div className="relative mb-6">
              {/* Radar waves behind logo */}
              <motion.div
                animate={{
                  scale: [1, 1.4, 1.8],
                  opacity: [0.4, 0.15, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full bg-white"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1.6],
                  opacity: [0.35, 0.1, 0],
                }}
                transition={{
                  duration: 2.2,
                  delay: 0.7,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full bg-white"
              />

              <motion.div
                initial={{ scale: 0.4, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  damping: 10,
                  stiffness: 85,
                  delay: 0.15,
                }}
                className="relative z-10 w-28 h-28 rounded-[28px] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center"
              >
                <img
                  src="/dolly_logo.jpg"
                  alt="Dolly Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>

            {/* Dolly Brand text with sliding effects */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="font-black text-4xl text-white tracking-widest uppercase drop-shadow-[0_4px_12px_rgba(244,63,94,0.4)]"
            >
              Dolly
            </motion.h1>

            {/* Sub-texts / Taglines requested by user */}
            <div className="mt-8 flex flex-col items-center space-y-2 text-center max-w-xs px-2">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="text-xs font-extrabold tracking-wide text-rose-50 pr-0.5">
                  Temukan Teman Baru
                </span>
              </motion.div>

              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-300 fill-pink-300 animate-pulse" />
                <span className="text-xs font-extrabold tracking-wide text-rose-50 pr-0.5">
                  Temukan Keseruan Baru
                </span>
              </motion.div>
            </div>
          </div>

          {/* Bottom components */}
          <div className="w-full flex flex-col items-center max-w-[200px] mb-4">
            {/* Interactive Loading Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.5, ease: "easeInOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_8px_white]"
              />
            </div>
            
            <span className="text-[9px] font-bold text-white/50 tracking-wider mt-3 uppercase">
              Memuat Aplikasi Dolly...
            </span>

            <span className="text-[8px] font-medium text-white/45 mt-1.5 border border-white/10 px-2 py-0.5 rounded-md hover:bg-white/5 cursor-pointer">
              Sentuh Untuk Melewati
            </span>
          </div>
        </motion.div>
      </MobileFrame>
    );
  }

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
      {/* Custom sliding head-up top push notification banner */}
      <AnimatePresence>
        {activeSystemNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 0.99 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            onClick={() => {
              if (activeSystemNotification.senderId) {
                setActiveTab('chat');
                setActiveChatId(activeSystemNotification.senderId);
              }
              setActiveSystemNotification(null);
            }}
            id="native_like_headsup_banner"
            className="absolute top-3 left-3 right-3 bg-zinc-900 shadow-2xl text-white px-4 py-3 rounded-2xl flex items-center space-x-3 border border-white/10 z-[9999] hover:bg-zinc-855 cursor-pointer select-none"
          >
            {activeSystemNotification.avatar ? (
              <img
                src={activeSystemNotification.avatar}
                alt="Notification Sender Profile Avatar"
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/20 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-505 flex items-center justify-center text-white shrink-0 font-black shadow-xs">
                <span>D</span>
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Dolly Pemberitahuan</span>
                <span className="text-[8px] font-medium text-white/40 font-mono">Sekarang</span>
              </div>
              <h4 className="text-xs font-black truncate leading-tight text-white mt-1">{activeSystemNotification.title}</h4>
              <p className="text-[10px] text-zinc-300 font-medium truncate leading-normal">{activeSystemNotification.body}</p>
            </div>
            
            {/* Direct indicator icon */}
            <div className="text-white/35 shrink-0 bg-white/5 p-1 rounded-lg">
              <MessageCircle className="w-4 h-4 text-rose-300 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  user={user}
                  onLikeStatus={handleLikeStatus}
                  onCommentStatus={handleCommentStatus}
                  onPostStatus={handlePostStatus}
                  onDeleteStatus={handleDeleteStatus}
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
