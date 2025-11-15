// =============================================
// MODAL ROUTER CONTAINER HOOK
// =============================================
// Container hook for managing modal state through URL parameters

import { useCallback, useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';

// =============================================
// TYPES
// =============================================

export interface UseModalRouterReturn {
  // Current modal state
  isOpen: boolean;
  modalType: string | null;
  modalId: string | null;
  returnUrl: string | null;
  
  // Modal actions
  openModal: (type: string, id?: string, returnUrl?: string) => void;
  closeModal: () => void;
  
  // Modal type checkers
  isTaskModal: boolean;
  isWorkspaceModal: boolean;
  isSectionModal: boolean;
  isSettingsModal: boolean;
  
  // Data accessors
  getModalData: () => { type: string | null; id: string | null; returnUrl: string | null };
}

// =============================================
// MODAL TYPES
// =============================================

export const MODAL_TYPES = {
  TASK_DETAIL: 'task-detail',
  TASK_CREATE: 'task-create',
  TASK_EDIT: 'task-edit',
  WORKSPACE_CREATE: 'workspace-create',
  WORKSPACE_EDIT: 'workspace-edit',
  WORKSPACE_SETTINGS: 'workspace-settings',
  SECTION_CREATE: 'section-create',
  SECTION_EDIT: 'section-edit',
  USER_SETTINGS: 'user-settings',
  INVITE_MEMBERS: 'invite-members',
} as const;

export type ModalType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useModalRouter = (): UseModalRouterReturn => {
  const { getModalState, openModal: routerOpenModal, closeModal: routerCloseModal } = useRouter();
  
  // Get current modal state
  const modalState = getModalState();
  const { type: modalType, id: modalId, returnUrl } = modalState;
  
  // Computed properties
  const isOpen = Boolean(modalType);
  
  const isTaskModal = useMemo(() => {
    if (!modalType) return false;
    return modalType.startsWith('task-');
  }, [modalType]);
  
  const isWorkspaceModal = useMemo(() => {
    if (!modalType) return false;
    return modalType.startsWith('workspace-');
  }, [modalType]);
  
  const isSectionModal = useMemo(() => {
    if (!modalType) return false;
    return modalType.startsWith('section-');
  }, [modalType]);
  
  const isSettingsModal = useMemo(() => {
    if (!modalType) return false;
    return modalType.includes('settings');
  }, [modalType]);
  
  // Actions
  const openModal = useCallback((type: string, id?: string, returnUrl?: string) => {
    routerOpenModal(type, id, returnUrl);
  }, [routerOpenModal]);
  
  const closeModal = useCallback(() => {
    routerCloseModal();
  }, [routerCloseModal]);
  
  // Data accessor
  const getModalData = useCallback(() => {
    return {
      type: modalType,
      id: modalId,
      returnUrl,
    };
  }, [modalType, modalId, returnUrl]);
  
  return {
    // Current modal state
    isOpen,
    modalType,
    modalId,
    returnUrl,
    
    // Modal actions
    openModal,
    closeModal,
    
    // Modal type checkers
    isTaskModal,
    isWorkspaceModal,
    isSectionModal,
    isSettingsModal,
    
    // Data accessors
    getModalData,
  };
};