import { create } from 'zustand';

interface UserStatus {
  online: boolean;
  lastSeenAt?: string;
  isTyping?: boolean;
}

interface StatusState {
  statuses: Record<string, UserStatus>;
  setOnline: (userId: string, online: boolean, lastSeenAt?: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

export const useUsersStatusStore = create<StatusState>((set) => ({
  statuses: {},
  setOnline: (userId, online, lastSeenAt) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        [userId]: {
          ...state.statuses[userId],
          online,
          lastSeenAt: lastSeenAt ?? state.statuses[userId]?.lastSeenAt,
          isTyping: false,
        },
      },
    })),
  setTyping: (userId, isTyping) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        [userId]: {
          ...state.statuses[userId],
          isTyping,
        },
      },
    })),
}));
