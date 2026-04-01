import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  commandOpen: boolean
  quickAddFocusRequested: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleCommand: () => void
  requestQuickAddFocus: () => void
  clearQuickAddFocus: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  commandOpen: false,
  quickAddFocusRequested: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),
  requestQuickAddFocus: () => set({ quickAddFocusRequested: true }),
  clearQuickAddFocus: () => set({ quickAddFocusRequested: false }),
}))
