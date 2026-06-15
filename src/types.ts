/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Person {
  id: string;
  name: string;
  age: number;
  distance: string;
  avatar: string;
  online: boolean;
  gender: 'Laki-laki' | 'Perempuan';
  bio: string;
  statusMessage?: string;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or Person.id
  text: string;
  timestamp: string;
  unread?: boolean;
  type?: 'text' | 'image' | 'voice';
  mediaUrl?: string;
}

export interface Chat {
  id: string; // usually same as personId
  personId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export interface StatusComment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface Status {
  id: string;
  personId: string; // 'me' or Person.id
  authorName: string;
  authorAvatar: string;
  text: string;
  image?: string;
  timestamp: string;
  likes: string[]; // names of users who liked
  comments: StatusComment[];
}

export interface FriendRequest {
  id: string;
  personId: string;
  name: string;
  age: number;
  avatar: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'wave' | 'request';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  senderId?: string;
}
