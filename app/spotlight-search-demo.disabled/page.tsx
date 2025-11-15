// =============================================
// SPOTLIGHT SEARCH DEMO PAGE
// =============================================
// Demo page to showcase and test the SpotlightSearch functionality

'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import { Search as SearchIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';
import { 
  SpotlightSearchProvider,
  useSpotlightControls,
} from '@/components/SpotlightSearch';
import { AuthProvider } from '@/components/Auth';
import { ThemeProvider } from '@/components/ThemeProvider';

// =============================================
// DEMO CONTROLS COMPONENT
// =============================================

const SpotlightDemo: React.FC = () => {
  const { openSearch, isOpen } = useSpotlightControls();

  const handleOpenSearch = (): void => {
    openSearch();
  };

  const shortcuts = [
    { key: 'Cmd + K', description: 'Open search modal (Mac)' },
    { key: 'Ctrl + K', description: 'Open search modal (Windows/Linux)' },
    { key: '↑ ↓', description: 'Navigate results' },
    { key: 'Enter', description: 'Select result' },
    { key: 'Tab', description: 'Switch categories' },
    { key: 'Esc', description: 'Close modal' },
  ];

  const features = [
    'Global search across workspaces, sections, and tasks',
    'Fuzzy search with text highlighting',
    'Real-time search with 300ms debouncing',
    'Category filtering (All, Workspaces, Sections, Tasks, People)',
    'Keyboard navigation and shortcuts',
    'Quick actions for creating new items',
    'Recent search history',
    'Responsive design (fullscreen on mobile)',
    'macOS-inspired UI with Material Design components',
    'Container-presenter architecture pattern',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
          🔍 Spotlight Search Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          macOS-inspired global search for the todo application
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={handleOpenSearch}
            sx={{ minWidth: 200 }}
          >
            Open Search Modal
          </Button>
          <Chip
            label={isOpen ? 'Search Open' : 'Search Closed'}
            color={isOpen ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Try pressing <strong>Cmd + K</strong> (Mac) or <strong>Ctrl + K</strong> (Windows/Linux) to open search
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Features */}
        <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                ✨ Features
              </Typography>
              <List dense>
                {features.map((feature) => (
                  <ListItem key={feature} disablePadding>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

        {/* Keyboard Shortcuts */}
        <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyboardIcon /> Keyboard Shortcuts
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {shortcuts.map((shortcut) => (
                  <Box
                    key={shortcut.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2">
                      {shortcut.description}
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        backgroundColor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 0.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {shortcut.key}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

        {/* Search Demo */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🔍 Search Demo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The search modal includes mock data for testing. Try searching for:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {[
                  'Personal Projects',
                  'Work Dashboard', 
                  'Today',
                  'Fix navbar',
                  'Create dashboard',
                  'John Doe',
                  'john@example.com'
                ].map((term) => (
                  <Chip
                    key={term}
                    label={term}
                    variant="outlined"
                    size="small"
                    onClick={handleOpenSearch}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Click any term above or use the search button to open the modal and try searching.
              </Typography>
            </CardContent>
          </Card>

        {/* Technical Implementation */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🏗️ Technical Implementation
              </Typography>
              <Typography variant="body2" paragraph>
                The Spotlight Search component follows the strict container-presenter architecture pattern:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Container Hook (useSpotlightSearch.ts)"
                    secondary="Contains all business logic, state management, fuzzy search algorithms, and keyboard navigation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Presenter Component (SpotlightSearch.tsx)"
                    secondary="Pure UI component using MUI with macOS-inspired design tokens and animations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Provider Integration (SpotlightSearchProvider.tsx)"
                    secondary="Global context provider with keyboard shortcut registration and easy-to-use hooks"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
      </Box>
    </Container>
  );
};

// =============================================
// MAIN PAGE COMPONENT
// =============================================

export default function SpotlightSearchDemoPage(): React.ReactElement {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SpotlightSearchProvider>
          <SpotlightDemo />
        </SpotlightSearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}