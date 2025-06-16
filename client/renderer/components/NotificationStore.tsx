import { create } from 'zustand';

interface Notification {
  text: string;
  time: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (index: number) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (notification) => 

    set((state) => ({ notifications: [notification, ...state.notifications] })),

  removeNotification: (index) => 

    set((state) => ({ notifications: state.notifications.filter((_, i) => i !== index) })),

  clearNotifications: () => set({ notifications: [] }),

}));