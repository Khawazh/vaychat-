import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
  senderName?: string;
}

export interface ChatItem {
  id: string;
  title: string;
  lastMessage?: string;
  time?: string;
  online?: boolean;
  unread?: number;
  participantId?: string;
  type?: string;
  ownerId?: string;
  avatarUrl?: string; // <-- новое поле
}

interface ChatState {
  ownerId: string | null;
  chats: ChatItem[];
  activeChatId: string | null;
  messagesByChatId: Record<string, Message[]>;
  setChats: (chats: ChatItem[]) => void;
  addChat: (chat: ChatItem) => void;
  setActiveChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  updateLastMessage: (chatId: string, content: string, time: string) => void;
  ensureOwner: (userId: string) => void;
  removeChat: (chatId: string) => void;
}

const deduplicate = (chats: ChatItem[]): ChatItem[] => {
  const seen = new Set<string>();
  return chats.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      ownerId: null,
      chats: [],
      activeChatId: null,
      messagesByChatId: {},
      setChats: (chats) => set({ chats: deduplicate(chats) }),
      addChat: (chat) =>
        set((state) => {
          const exists = state.chats.some((c) => c.id === chat.id);
          if (exists) return state;
          return { chats: deduplicate([chat, ...state.chats]) };
        }),
      setActiveChat: (chatId) => set({ activeChatId: chatId }),
      addMessage: (chatId, message) =>
        set((state) => ({
          messagesByChatId: {
            ...state.messagesByChatId,
            [chatId]: [...(state.messagesByChatId[chatId] || []), message],
          },
        })),
      setMessages: (chatId, messages) =>
        set((state) => ({
          messagesByChatId: {
            ...state.messagesByChatId,
            [chatId]: messages,
          },
        })),
      updateLastMessage: (chatId, content, time) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, lastMessage: content, time } : chat
          ),
        })),
      ensureOwner: (userId) =>
        set((state) => {
          if (state.ownerId !== userId) {
            return {
              ownerId: userId,
              chats: [],
              activeChatId: null,
              messagesByChatId: {},
            };
          }
          return {};
        }),
      removeChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== chatId),
          messagesByChatId: (() => {
            const { [chatId]: _, ...rest } = state.messagesByChatId;
            return rest;
          })(),
          activeChatId:
            state.activeChatId === chatId ? null : state.activeChatId,
        })),
    }),
    { name: 'vaychat-chats' }
  )
);
