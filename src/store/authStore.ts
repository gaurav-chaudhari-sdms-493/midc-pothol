import { create } from 'zustand';

export type Role = 'citizen' | 'engineer';

interface AuthState {
  role: Role;
  setRole: (role: Role) => void;
  toggleRole: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: 'citizen', // Default role for the prototype
  setRole: (role) => set({ role }),
  toggleRole: () => set((state) => ({ role: state.role === 'citizen' ? 'engineer' : 'citizen' })),
}));
