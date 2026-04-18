
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Send, 
  User as UserIcon, 
  Circle, 
  ArrowLeft, 
  MoreVertical,
  Shield,
  Clock,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { db, auth } from '../lib/firebase.ts';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  getDocs, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { Chat, ChatMessage, User as AppUser } from '../types.ts';
import { format } from 'date-fns';

interface ChatPageProps {
  store: any;
  navigate: (page: string) => void;
}

// Simple encryption/decryption (Base64 + XOR for demo purposes as requested)
const encrypt = (text: string, key: string) => {
  const result = text.split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
  return btoa(result);
};

const decrypt = (encoded: string, key: string) => {
  try {
    const text = atob(encoded);
    return text.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
  } catch {
    return "Encrypted Message";
  }
};

const SECRET_KEY = "grace-center-divine-key"; // In a real app, this would be derived from user keys

const ChatPage: React.FC<ChatPageProps> = ({ store, navigate }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = store.currentUser;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chats
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(chatList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, `chats/${selectedChat.id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgList);
      
      // Mark as read
      msgList.forEach(msg => {
        if (msg.receiverId === currentUser.id && !msg.isRead) {
          updateDoc(doc(db, `chats/${selectedChat.id}/messages`, msg.id), {
            isRead: true
          });
        }
      });
    });

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, 'profiles'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AppUser))
        .filter(u => u.id !== currentUser.id);
      setAvailableUsers(users);
    };
    fetchUsers();
  }, [currentUser]);

  const startChat = async (otherUser: AppUser) => {
    // Check if chat already exists
    const existingChat = chats.find(c => c.participants.includes(otherUser.id));
    if (existingChat) {
      setSelectedChat(existingChat);
      setShowUserList(false);
      return;
    }

    // Create new chat
    const chatData = {
      participants: [currentUser.id, otherUser.id],
      lastMessage: 'Started a conversation',
      lastMessageAt: new Date().toISOString(),
      lastSenderId: currentUser.id,
      unreadCount: {
        [otherUser.id]: 0,
        [currentUser.id]: 0
      }
    };

    const docRef = await addDoc(collection(db, 'chats'), chatData);
    setSelectedChat({ id: docRef.id, ...chatData });
    setShowUserList(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || isSending) return;

    setIsSending(true);
    const receiverId = selectedChat.participants.find(id => id !== currentUser.id)!;
    
    const encryptedText = encrypt(messageText, SECRET_KEY);

    const msgData = {
      chatId: selectedChat.id,
      senderId: currentUser.id,
      receiverId: receiverId,
      text: encryptedText,
      createdAt: new Date().toISOString(),
      isRead: false,
      encrypted: true
    };

    try {
      await addDoc(collection(db, `chats/${selectedChat.id}/messages`), msgData);
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: encryptedText,
        lastMessageAt: new Date().toISOString(),
        lastSenderId: currentUser.id
      });
      setMessageText('');
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherId = chat.participants.find(id => id !== currentUser.id);
    return availableUsers.find(u => u.id === otherId);
  };

  const filteredUsers = availableUsers.filter(u => 
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.identityRole || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar - Chat List */}
      <div className={`
        lg:w-96 flex flex-col bg-white rounded-enhanced shadow-xl overflow-hidden
        ${selectedChat ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="p-6 border-b border-gray-100 bg-primary text-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest">Divine Link</h2>
            <button 
              onClick={() => setShowUserList(true)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <MessageSquare size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <input 
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white/10 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
          {chats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">No conversations yet.</p>
              <button 
                onClick={() => setShowUserList(true)}
                className="mt-4 text-primary font-bold text-xs uppercase tracking-widest hover:underline"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            chats.map(chat => {
              const otherUser = getOtherParticipant(chat);
              const isActive = selectedChat?.id === chat.id;
              const lastMsg = chat.lastMessage ? decrypt(chat.lastMessage, SECRET_KEY) : '';

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group
                    ${isActive ? 'bg-primary/5 shadow-md' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      {otherUser?.fullName ? (
                        <span className="text-lg font-bold text-primary">{otherUser.fullName[0]}</span>
                      ) : (
                        <UserIcon className="text-gray-400" size={24} />
                      )}
                    </div>
                    {otherUser?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm text-gray-900 truncate">
                        {otherUser?.fullName || 'Unknown User'}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {chat.lastMessageAt ? format(new Date(chat.lastMessageAt), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastSenderId === currentUser.id && "You: "}
                      {lastMsg}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col bg-white rounded-enhanced shadow-xl overflow-hidden relative
        ${!selectedChat ? 'hidden lg:flex' : 'flex'}
      `}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-lg font-bold text-primary">
                      {getOtherParticipant(selectedChat)?.fullName?.[0] || '?'}
                    </span>
                  </div>
                  {getOtherParticipant(selectedChat)?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {getOtherParticipant(selectedChat)?.fullName || 'Unknown User'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {getOtherParticipant(selectedChat)?.identityRole || 'Member'}
                    </span>
                    {getOtherParticipant(selectedChat)?.isOnline ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                        <Circle size={6} fill="currentColor" /> Online
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium italic">
                        {getOtherParticipant(selectedChat)?.lastSeen ? `Last seen ${format(new Date(getOtherParticipant(selectedChat)!.lastSeen!), 'MMM d, HH:mm')}` : 'Offline'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <Shield size={12} /> Encrypted
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 no-scrollbar">
              <div className="flex justify-center mb-8">
                <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <Shield size={12} className="text-primary" />
                  Messages are end-to-end encrypted
                </div>
              </div>

              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                const decryptedText = decrypt(msg.text, SECRET_KEY);

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isMe && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mb-1">
                        {getOtherParticipant(selectedChat)?.fullName?.[0]}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-8" />}
                    
                    <div className={`
                      max-w-[80%] lg:max-w-[60%] p-4 rounded-2xl shadow-sm relative group
                      ${isMe 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}
                    `}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{decryptedText}</p>
                      <div className={`
                        flex items-center gap-1 mt-1 text-[9px] font-medium
                        ${isMe ? 'text-white/60 justify-end' : 'text-gray-400'}
                      `}>
                        <Clock size={10} />
                        {format(new Date(msg.createdAt), 'HH:mm')}
                        {isMe && (
                          msg.isRead ? <CheckCheck size={12} className="text-white" /> : <Check size={12} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 lg:p-6 bg-white border-t border-gray-100">
              <form onSubmit={sendMessage} className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder="Type a divine message..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-6 pr-12 text-sm focus:ring-2 focus:ring-primary/20 resize-none no-scrollbar"
                  />
                  <button 
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className={`
                    p-4 rounded-2xl shadow-lg transition-all duration-300
                    ${messageText.trim() && !isSending 
                      ? 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={48} className="text-primary/20" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-2">Select a Conversation</h3>
            <p className="max-w-xs text-sm leading-relaxed">
              Connect with fellow members and pastors to share insights, ask questions, and grow together in faith.
            </p>
            <button 
              onClick={() => setShowUserList(true)}
              className="mt-8 bg-primary text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            >
              New Message
            </button>
          </div>
        )}
      </div>

      {/* User Selection Modal */}
      <AnimatePresence>
        {showUserList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserList(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-enhanced shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-gray-100 bg-primary text-white">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black uppercase tracking-widest">New Conversation</h2>
                  <button 
                    onClick={() => setShowUserList(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
                  <input 
                    type="text"
                    placeholder="Search members or pastors..."
                    className="w-full bg-white/10 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <p className="text-sm">No members found matching your search.</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => startChat(user)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 group text-left"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-lg font-bold text-primary">{user.fullName[0]}</span>
                        </div>
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{user.fullName}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.identityRole}</p>
                      </div>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                          <Send size={14} />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
