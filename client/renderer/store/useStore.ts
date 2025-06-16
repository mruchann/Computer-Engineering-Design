import { create } from 'zustand';

// Define the store
interface AppState {
    count: number;
    increment: () => void;
    decrement: () => void;
}

export const useStore = create<AppState>((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
}));
