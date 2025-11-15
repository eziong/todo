// =============================================
// COMPLETED TASKS PAGE
// =============================================
// Dedicated page for completed tasks with infinite scroll

'use client';

import React from 'react';
import { Box } from '@mui/material';
import { NavigationSidebar } from '@/components/NavigationSidebar/NavigationSidebar';
import { CompletedTasksView } from '@/components/CompletedTasksView/CompletedTasksView';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation/BreadcrumbNavigation';
import { SpotlightSearchProvider } from '@/components/SpotlightSearch/SpotlightSearchProvider';
import { ModalRouter } from '@/components/ModalRouter/ModalRouter';
import { withAuth } from '@/components/Auth/withAuth';

const CompletedPage: React.FC = () => {
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
          
          {/* Completed Tasks Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <CompletedTasksView />
          </Box>
        </Box>
        
        {/* Modal Router */}
        <ModalRouter />
      </Box>
    </SpotlightSearchProvider>
  );
};

export default withAuth(CompletedPage);