// =============================================
// DASHBOARD PAGE
// =============================================
// Main dashboard page with navigation and content area

'use client';

import React from 'react';
import { Box } from '@mui/material';
import { NavigationSidebar } from '@/components/NavigationSidebar/NavigationSidebar';
import { MainContent } from '@/components/MainContent/MainContent';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation/BreadcrumbNavigation';
import { SpotlightSearchProvider } from '@/components/SpotlightSearch/SpotlightSearchProvider';
import { ModalRouter } from '@/components/ModalRouter/ModalRouter';
import { withAuth } from '@/components/Auth/withAuth';

const DashboardPage: React.FC = () => {
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
          
          {/* Content */}
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

export default withAuth(DashboardPage);