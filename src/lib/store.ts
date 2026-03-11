import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Accessibility Settings Store
interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  screenReaderMode: boolean;
  keyboardNavOnly: boolean;
  reducedMotion: boolean;
  ttsEnabled: boolean;
  asrEnabled: boolean;
  signLanguageEnabled: boolean;
  darkMode: boolean;
}

interface AccessibilityStore extends AccessibilitySettings {
  setFontSize: (size: number) => void;
  toggleHighContrast: () => void;
  toggleScreenReaderMode: () => void;
  toggleKeyboardNavOnly: () => void;
  toggleReducedMotion: () => void;
  toggleTTSEnabled: () => void;
  toggleASREnabled: () => void;
  toggleSignLanguageEnabled: () => void;
  toggleDarkMode: () => void;
  resetSettings: () => void;
}

const defaultAccessibilitySettings: AccessibilitySettings = {
  fontSize: 16,
  highContrast: false,
  screenReaderMode: false,
  keyboardNavOnly: false,
  reducedMotion: false,
  ttsEnabled: true,
  asrEnabled: true,
  signLanguageEnabled: true,
  darkMode: false,
};

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      ...defaultAccessibilitySettings,
      setFontSize: (size) => set({ fontSize: size }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      toggleScreenReaderMode: () => set((state) => ({ screenReaderMode: !state.screenReaderMode })),
      toggleKeyboardNavOnly: () => set((state) => ({ keyboardNavOnly: !state.keyboardNavOnly })),
      toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
      toggleTTSEnabled: () => set((state) => ({ ttsEnabled: !state.ttsEnabled })),
      toggleASREnabled: () => set((state) => ({ asrEnabled: !state.asrEnabled })),
      toggleSignLanguageEnabled: () => set((state) => ({ signLanguageEnabled: !state.signLanguageEnabled })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      resetSettings: () => set(defaultAccessibilitySettings),
    }),
    {
      name: 'accessibility-settings',
      version: 1,
    }
  )
);

// Auth Store
interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  disabilityType?: string;
  grade?: string;
  section?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      version: 2,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Navigation Store
interface NavStore {
  activeSection: string;
  setActiveSection: (section: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

// Notification Store
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Date.now().toString(),
          read: false,
          createdAt: new Date(),
        },
        ...state.notifications,
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
