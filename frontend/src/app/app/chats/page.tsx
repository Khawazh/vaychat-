'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Trash2, UserPlus } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { chatsApi, usersApi, messagesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chatStore';
import { useUsersStatusStore } from '@/store/usersStatusStore';
import { cn } from '@/lib/utils';

interface UserItem {
  id: string;
  phone: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

const SOCKET_URL = 'http://localhost:4000';

export default function ChatsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatType, setChatType] = useState<'private' | 'channel'>('private');
  const [channelTitle, setChannelTitle] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const {
    chats,
    activeChatId,
    messagesByChatId,
    setChats,
    addChat,
    setActiveChat,
    addMessage,
    setMessages,
    updateLastMessage,
    removeChat,
  } = useChatStore();

  const { setOnline, setTyping } = useUsersStatusStore();
  const userStatuses = useUsersStatusStore((s) => s.statuses);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0] ?? null;
  const activeMessages = activeChatId ? messagesByChatId[activeChatId] || [] : [];
  const isChannel = activeChat?.type === 'CHANNEL';
  const isOwner = activeChat?.ownerId === user?.id;

  // Load chats (with avatarUrl)
  useEffect(() => {
    if (!accessToken) return;
    if (chats.length === 0) {
      chatsApi
        .list(accessToken)
        .then((res) => {
          const rawChats = res.chats as Array<Record<string, unknown>>;
          const list = rawChats.map((c) => {
            const members = (c.members as Array<Record<string, unknown>>) || [];
            let participantId: string | undefined;
            let ownerId: string | undefined;
            let avatarUrl: string | undefined;
            if (c.type === 'PRIVATE' && members.length === 2) {
              const other = members.find((m) => m.user?.id !== user?.id);
              if (other?.user) {
                participantId = other.user.id as string;
                avatarUrl = other.user.avatarUrl as string | undefined;
              }
            }
            if (c.type === 'CHANNEL') {
              const owner = members.find((m) => m.role === 'OWNER');
              if (owner?.user?.id) ownerId = owner.user.id as string;
            }
            return {
              id: String(c.id),
              title: String(c.title ?? c.type ?? 'Chat'),
              lastMessage:
                (c.lastMessage as { content?: string; sender?: { displayName?: string } } | null)?.content ?? 'No messages',
              time: new Date().toISOString(),
              online: false,
              unread: Number(c.unreadCount ?? 0),
              participantId,
              type: String(c.type ?? 'PRIVATE'),
              ownerId,
              avatarUrl,
            };
          });
          setChats(list);
          if (list[0] && !activeChatId) setActiveChat(list[0].id);
          if (socketRef.current?.connected) {
            list.forEach((chat) => socketRef.current!.emit('chat:join', chat.id));
          }
        })
        .catch(() => setChats([]));
    }
  }, [accessToken, chats.length, activeChatId, setChats, setActiveChat, user?.id]);

  // Socket connection + auto-join + chat:added
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      useChatStore.getState().chats.forEach((chat) => {
        socket.emit('chat:join', chat.id);
      });
    });

    socket.on('message:new', (msg: any) => {
      const chatId = msg.chatId;
      const newMsg = {
        id: msg.id,
        content: msg.content,
        time: msg.createdAt || new Date().toISOString(),
        isOwn: msg.senderId === user?.id,
        isRead: false,
        senderName: msg.sender?.displayName,
      };
      addMessage(chatId, newMsg);
      updateLastMessage(chatId, msg.content, newMsg.time);
    });

    socket.on('user:online', ({ userId }: { userId: string }) => {
      setOnline(userId, true);
      setChats(
        useChatStore.getState().chats.map((chat) =>
          chat.participantId === userId ? { ...chat, online: true } : chat
        )
      );
    });

    socket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnline(userId, false, new Date().toISOString());
      setChats(
        useChatStore.getState().chats.map((chat) =>
          chat.participantId === userId ? { ...chat, online: false } : chat
        )
      );
    });

    socket.on('typing:update', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTyping(userId, isTyping);
    });

    socket.on('chat:added', (data: { chat: { id: string; title: string; type: string } }) => {
      const chat = data.chat;
      const exists = useChatStore.getState().chats.some((c) => c.id === chat.id);
      if (!exists) {
        addChat({
          id: chat.id,
          title: chat.title,
          lastMessage: undefined,
          time: new Date().toISOString(),
          online: false,
          unread: 0,
          type: chat.type,
          participantId: undefined,
          ownerId: undefined,
        });
      }
      socket.emit('chat:join', chat.id);
    });

    socket.on('error', (err: { message: string }) => {
      if (err.message === 'Not a member') return;
      console.error('Socket error:', err.message);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [accessToken, user?.id, addMessage, updateLastMessage, setOnline, setTyping, setChats, addChat]);

  // Join active chat + load history
  useEffect(() => {
    if (!socketRef.current || !activeChatId || !accessToken) return;
    socketRef.current.emit('chat:join', activeChatId);
    if (!messagesByChatId[activeChatId]) {
      messagesApi.getHistory(accessToken, activeChatId).then((data) => {
        const history = data.messages.map((m) => ({
          id: m.id,
          content: m.content,
          time: m.createdAt,
          isOwn: m.senderId === user?.id,
          isRead: false,
          senderName: (m as any).sender?.displayName,
        }));
        setMessages(activeChatId, history);
      }).catch(() => {});
    }
  }, [activeChatId, accessToken, messagesByChatId, user?.id, setMessages]);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || !socketRef.current || !activeChatId) return;
      if (isChannel && !isOwner) return;
      socketRef.current.emit('message:send', {
        chatId: activeChatId,
        content: message,
      });
      setMessage('');
      socketRef.current.emit('typing:stop', { chatId: activeChatId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
    },
    [message, activeChatId, isChannel, isOwner]
  );

  const handleInputChange = (value: string) => {
    setMessage(value);
    if (!socketRef.current || !activeChatId) return;
    if (!isTyping) {
      socketRef.current.emit('typing:start', { chatId: activeChatId });
      setIsTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { chatId: activeChatId });
      setIsTyping(false);
    }, 2000);
  };

  const handleDeleteChat = async () => {
    if (!accessToken || !activeChatId) return;
    try {
      await chatsApi.leave(accessToken, activeChatId);
    } catch (err: any) {
      console.error('Delete error:', err.message);
    } finally {
      removeChat(activeChatId);
    }
  };

  const getActiveChatTypingStatus = () => {
    if (!activeChat?.participantId) return null;
    return userStatuses[activeChat.participantId]?.isTyping;
  };

  const loadUsers = async () => {
    if (!accessToken) return;
    try {
      const data = await usersApi.list(accessToken);
      setUsers((data.users as UserItem[]) || []);
    } catch {
      setUsers([]);
    }
  };

  const handleOpenNewChat = () => {
    setShowNewChat(true);
    setChatType('private');
    setChannelTitle('');
    setChannelDescription('');
    loadUsers();
  };

  const handleOpenAddMember = () => {
    setShowAddMember(true);
    loadUsers();
  };

  const handleAddMember = async (userId: string) => {
    if (!accessToken || !activeChatId) return;
    try {
      await chatsApi.addMember(accessToken, activeChatId, userId);
      setShowAddMember(false);
    } catch (err: any) {
      console.error('Add member error:', err.message);
    }
  };

  const handleCreatePrivate = async (participantId: string) => {
    if (!accessToken) return;
    try {
      const res = await chatsApi.create(accessToken, participantId);
      const newChat = {
        id: String(res.chat?.id || res.id),
        title: String(res.chat?.title || 'New chat'),
        lastMessage: undefined,
        time: new Date().toISOString(),
        online: false,
        unread: 0,
        participantId,
        type: 'PRIVATE',
      };
      addChat(newChat);
      setActiveChat(newChat.id);
      setShowNewChat(false);
      if (socketRef.current) {
        socketRef.current.emit('chat:join', newChat.id);
      }
    } catch (err) {
      console.error('Error creating private chat', err);
    }
  };

  const handleCreateChannel = async () => {
    if (!accessToken || !channelTitle.trim()) return;
    try {
      const res = await chatsApi.createChannel(
        accessToken,
        channelTitle.trim(),
        channelDescription.trim() || undefined
      );
      const newChat = {
        id: String(res.chat?.id || res.id),
        title: String(res.chat?.title || 'New channel'),
        lastMessage: undefined,
        time: new Date().toISOString(),
        online: false,
        unread: 0,
        participantId: undefined,
        type: 'CHANNEL',
        ownerId: user!.id,
      };
      addChat(newChat);
      setActiveChat(newChat.id);
      setShowNewChat(false);
      if (socketRef.current) {
        socketRef.current.emit('chat:join', newChat.id);
      }
    } catch (err) {
      console.error('Error creating channel', err);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex w-full flex-col border-r border-white/5 md:w-80 lg:w-96">
        <header className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-white">Chats</h1>
          <button
            type="button"
            onClick={handleOpenNewChat}
            className="btn-secondary flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="New chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
            <Search className="h-4 w-4 text-green" />
            <input
              type="search"
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm outline-none text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {chats.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-white/40">
              No chats yet. Hello, {user?.displayName ?? 'friend'}!
            </p>
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                {...chat}
                active={activeChat?.id === chat.id}
                onClick={() => setActiveChat(chat.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className="hidden flex-1 flex-col md:flex">
        {activeChat ? (
          <>
            <header className="glass-panel flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                {activeChat.avatarUrl ? (
                  <img
                    src={activeChat.avatarUrl}
                    alt={activeChat.title}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    isChannel ? 'bg-yellow/20 text-yellow' : 'bg-green/20 text-green'
                  )}>
                    {isChannel ? '📢' : activeChat.title.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-white">{activeChat.title}</h2>
                  {isChannel && !isOwner && (
                    <p className="text-xs text-yellow/60">read only</p>
                  )}
                  {getActiveChatTypingStatus() && (
                    <p className="text-xs text-green">typing...</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isChannel && isOwner && (
                  <button
                    onClick={handleOpenAddMember}
                    className="rounded-xl p-2 text-white/40 hover:bg-green/10 hover:text-green transition"
                    title="Add member"
                  >
                    <UserPlus className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={handleDeleteChat}
                  className="rounded-xl p-2 text-white/40 hover:bg-red/10 hover:text-red transition"
                  title="Leave chat"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {activeMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  {...msg}
                  showSender={isChannel && !msg.isOwn}
                  isChannel={isChannel}
                />
              ))}
            </div>
            {!(isChannel && !isOwner) ? (
              <div className="border-t border-white/5 p-4">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    value={message}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-green/40"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary rounded-2xl px-6 py-3"
                  >
                    →
                  </motion.button>
                </form>
              </div>
            ) : (
              <div className="border-t border-white/5 p-4 text-center text-sm text-white/40">
                Only admin can send messages
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-white/40">
            Select a chat
          </div>
        )}
      </div>

      <div className={cn('flex flex-1 items-center justify-center md:hidden')}>
        <p className="text-white/40">{activeChat ? activeChat.title : 'Select a chat'}</p>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-sm rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">New chat</h2>
              <button onClick={() => setShowNewChat(false)} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex mb-4 gap-2">
              <button
                onClick={() => setChatType('private')}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-medium',
                  chatType === 'private' ? 'bg-green text-white' : 'bg-white/10 text-white/60'
                )}
              >
                Private
              </button>
              <button
                onClick={() => setChatType('channel')}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-medium',
                  chatType === 'channel' ? 'bg-green text-white' : 'bg-white/10 text-white/60'
                )}
              >
                Channel
              </button>
            </div>

            {chatType === 'private' ? (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {users.length === 0 && (
                  <p className="text-sm text-white/40">Loading users...</p>
                )}
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleCreatePrivate(u.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-white/5 transition"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.displayName || u.phone} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/20 text-green font-semibold">
                        {(u.displayName || u.phone).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{u.displayName || u.phone}</p>
                      <p className="text-xs text-white/50">
                        {u.username ? '@' + u.username : u.phone}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  placeholder="Channel name"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-green"
                />
                <textarea
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-green resize-none"
                />
                <button
                  onClick={handleCreateChannel}
                  disabled={!channelTitle.trim()}
                  className="w-full rounded-2xl bg-green py-3 font-semibold text-white disabled:opacity-50"
                >
                  Create channel
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-sm rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Add member</h2>
              <button onClick={() => setShowAddMember(false)} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {users.length === 0 && (
                <p className="text-sm text-white/40">Loading users...</p>
              )}
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleAddMember(u.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-white/5 transition"
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.displayName || u.phone} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/20 text-green font-semibold">
                      {(u.displayName || u.phone).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">{u.displayName || u.phone}</p>
                    <p className="text-xs text-white/50">
                      {u.username ? '@' + u.username : u.phone}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
