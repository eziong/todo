// =============================================
// MAIN CONTENT DEMO PAGE
// =============================================
// Demo page to test MainContent component implementation

'use client';

import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@/components/ThemeProvider';
import { MainContent } from '@/components/MainContent';

export default function MainContentDemoPage() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Box sx={{ 
        width: '100vw', 
        height: '100vh',
        overflow: 'auto',
        backgroundColor: 'background.default',
      }}>
        <MainContent />
      </Box>
    </ThemeProvider>
  );
}