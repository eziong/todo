// =============================================
// WORKSPACE DETAIL PAGE
// =============================================
// Dynamic page for individual workspace view

'use client';

import React from 'react';
import { Box } from '@mui/material';
import { NavigationSidebar } from '@/components/NavigationSidebar/NavigationSidebar';
import { MainContent } from '@/components/MainContent/MainContent';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation/BreadcrumbNavigation';
import { SpotlightSearchProvider } from '@/components/SpotlightSearch/SpotlightSearchProvider';
import { ModalRouter } from '@/components/ModalRouter/ModalRouter';
import { withAuth } from '@/components/Auth/withAuth';

// =============================================
// TYPES
// =============================================

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// =============================================
// PAGE COMPONENT
// =============================================

const WorkspacePage: React.FC<WorkspacePageProps> = ({ params, searchParams }) => {
  // In a real implementation, we would use the workspace ID to fetch specific workspace data
  // For now, we'll pass it through to the MainContent component
  
  return (
    <SpotlightSearchProvider>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Navigation Sidebar */}
        <NavigationSidebar />
        
        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation />
          
          {/* Workspace Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <MainContent />
          </Box>
        </Box>
        
        {/* Modal Router */}
        <ModalRouter />
      </Box>
    </SpotlightSearchProvider>
  );
};

export default withAuth(WorkspacePage);