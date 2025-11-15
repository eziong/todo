// =============================================
// MODAL ROUTER PRESENTER COMPONENT
// =============================================
// Pure functional component for rendering modals based on URL state

import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TaskDetailModal } from '@/components/TaskDetailModal/TaskDetailModal';
import { useModalRouter, MODAL_TYPES } from './useModalRouter';
import type { BaseComponentProps } from '@/types';

// =============================================
// TYPES
// =============================================

export interface ModalRouterProps extends BaseComponentProps {
  // Optional modal component overrides
  components?: {
    [key: string]: React.ComponentType<any>;
  };
}

// =============================================
// MODAL LOADING COMPONENT
// =============================================

const ModalLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    }}
  >
    <CircularProgress />
  </Box>
);

// =============================================
// PRESENTER COMPONENT
// =============================================

export const ModalRouter: React.FC<ModalRouterProps> = ({
  className,
  components = {},
}) => {
  const {
    isOpen,
    modalType,
    modalId,
    closeModal,
    isTaskModal,
    isWorkspaceModal,
    isSectionModal,
    isSettingsModal,
  } = useModalRouter();

  // Don't render anything if no modal is open
  if (!isOpen || !modalType) {
    return null;
  }

  // Render task-related modals
  if (isTaskModal) {
    switch (modalType) {
      case MODAL_TYPES.TASK_DETAIL:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              <TaskDetailModal
                taskId={modalId || ''}
                open={true}
                onClose={closeModal}
              />
            </Suspense>
          </div>
        );
      
      case MODAL_TYPES.TASK_CREATE:
        // In a real implementation, you'd have a TaskCreateModal component
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <TaskCreateModal open={true} onClose={closeModal} /> */}
              <Box>Task Create Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      case MODAL_TYPES.TASK_EDIT:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <TaskEditModal taskId={modalId} open={true} onClose={closeModal} /> */}
              <Box>Task Edit Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      default:
        console.warn(`Unknown task modal type: ${modalType}`);
        return null;
    }
  }

  // Render workspace-related modals
  if (isWorkspaceModal) {
    switch (modalType) {
      case MODAL_TYPES.WORKSPACE_CREATE:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <WorkspaceCreateModal open={true} onClose={closeModal} /> */}
              <Box>Workspace Create Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      case MODAL_TYPES.WORKSPACE_EDIT:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <WorkspaceEditModal workspaceId={modalId} open={true} onClose={closeModal} /> */}
              <Box>Workspace Edit Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      case MODAL_TYPES.WORKSPACE_SETTINGS:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <WorkspaceSettingsModal workspaceId={modalId} open={true} onClose={closeModal} /> */}
              <Box>Workspace Settings Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      default:
        console.warn(`Unknown workspace modal type: ${modalType}`);
        return null;
    }
  }

  // Render section-related modals
  if (isSectionModal) {
    switch (modalType) {
      case MODAL_TYPES.SECTION_CREATE:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <SectionCreateModal open={true} onClose={closeModal} /> */}
              <Box>Section Create Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      case MODAL_TYPES.SECTION_EDIT:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <SectionEditModal sectionId={modalId} open={true} onClose={closeModal} /> */}
              <Box>Section Edit Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      default:
        console.warn(`Unknown section modal type: ${modalType}`);
        return null;
    }
  }

  // Render settings modals
  if (isSettingsModal) {
    switch (modalType) {
      case MODAL_TYPES.USER_SETTINGS:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <UserSettingsModal open={true} onClose={closeModal} /> */}
              <Box>User Settings Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      case MODAL_TYPES.INVITE_MEMBERS:
        return (
          <div className={className}>
            <Suspense fallback={<ModalLoader />}>
              {/* <InviteMembersModal workspaceId={modalId} open={true} onClose={closeModal} /> */}
              <Box>Invite Members Modal - Not implemented yet</Box>
            </Suspense>
          </div>
        );
      
      default:
        console.warn(`Unknown settings modal type: ${modalType}`);
        return null;
    }
  }

  // Check for custom component overrides
  if (components[modalType]) {
    const CustomModal = components[modalType];
    return (
      <div className={className}>
        <Suspense fallback={<ModalLoader />}>
          <CustomModal
            id={modalId}
            open={true}
            onClose={closeModal}
          />
        </Suspense>
      </div>
    );
  }

  // Unknown modal type
  console.warn(`Unknown modal type: ${modalType}`);
  return null;
};