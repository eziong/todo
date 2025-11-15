// =============================================
// NAVIGATION SIDEBAR PRESENTER COMPONENT
// =============================================
// Pure functional component for navigation sidebar with MUI Drawer, search, and workspace hierarchy

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Paper,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Assignment as TaskIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon,
  Today as TodayIcon,
  CheckCircle as CompletedIcon,
  Timeline as ActivitiesIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { ThemeToggle } from '@/components/ThemeProvider/ThemeToggle/ThemeToggle';
import { useNavigationSidebar } from './useNavigationSidebar';
import { designTokens } from '@/theme/utils';
import type { Workspace, Section, User } from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface NavigationSidebarProps {
  className?: string;
  onToggleSidebar?: () => void;
}

// Component definitions outside render to avoid recreation
interface SearchResultsProps {
  state: {
    isSearching: boolean;
    searchQuery: string;
    searchResults: {
      workspaces: Workspace[];
      sections: Section[];
      recentItems: Array<{
        id: string;
        title: string;
        type: 'workspace' | 'section';
        workspace?: Workspace;
        section?: Section;
      }>;
    };
  };
  selectWorkspace: (id: string) => void;
  clearSearch: () => void;
  theme: {
    palette: {
      text: { primary: string };
      divider: string;
      primary: { main: string };
    };
  };
}

const SearchResults: React.FC<SearchResultsProps> = ({ state, selectWorkspace, clearSearch, theme }) => {
  if (!state.isSearching || state.searchQuery.length === 0) {
    return null;
  }

  const { searchResults } = state;
  const hasResults = searchResults.workspaces.length > 0 || 
                    searchResults.sections.length > 0 || 
                    searchResults.recentItems.length > 0;

  if (!hasResults) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mx: 2,
          mb: 2,
          backgroundColor: alpha(theme.palette.text.primary, 0.02),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: designTokens.borderRadius.md,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No results found for &quot;{state.searchQuery}&quot;
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ px: 1, pb: 2 }}>
      {searchResults.workspaces.length > 0 && (
        <>
          <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
            Workspaces
          </Typography>
          {searchResults.workspaces.map((workspace) => (
            <ListItemButton
              key={workspace.id}
              onClick={() => {
                selectWorkspace(workspace.id);
                clearSearch();
              }}
              sx={{
                mx: 1,
                borderRadius: designTokens.borderRadius.md,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: workspace.color,
                  }}
                />
              </ListItemIcon>
              <ListItemText 
                primary={workspace.name}
                secondary={workspace.description || 'Workspace'}
              />
            </ListItemButton>
          ))}
        </>
      )}

      {searchResults.sections.length > 0 && (
        <>
          <Typography variant="caption" sx={{ px: 2, pb: 1, pt: 1, display: 'block', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
            Sections
          </Typography>
          {searchResults.sections.map((section) => (
            <ListItemButton
              key={section.id}
              onClick={() => {
                selectWorkspace(section.workspace_id);
                clearSearch();
              }}
              sx={{
                mx: 1,
                borderRadius: designTokens.borderRadius.md,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon>
                <TaskIcon fontSize="small" sx={{ color: section.color }} />
              </ListItemIcon>
              <ListItemText 
                primary={section.name}
                secondary={section.description || 'Section'}
              />
            </ListItemButton>
          ))}
        </>
      )}
    </Box>
  );
};

// Workspace list component
interface WorkspaceListProps {
  state: {
    isSearching: boolean;
    selectedWorkspaceId: string | null;
    expandedWorkspaces: Set<string>;
    searchResults: {
      workspaces: Workspace[];
      sections: Section[];
      recentItems: Array<{
        id: string;
        title: string;
        type: 'workspace' | 'section';
        workspace?: Workspace;
        section?: Section;
      }>;
    };
    searchQuery: string;
  };
  workspaces: Workspace[];
  selectWorkspace: (id: string) => void;
  toggleWorkspaceExpansion: (id: string) => void;
  theme: {
    palette: {
      text: { primary: string };
      divider: string;
      primary: { main: string };
    };
  };
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({ state, workspaces, selectWorkspace, toggleWorkspaceExpansion, theme }) => {
  if (state.isSearching) {
    return <SearchResults state={state} selectWorkspace={selectWorkspace} clearSearch={() => {}} theme={theme} />;
  }

  return (
    <List sx={{ px: 1, py: 0 }}>
      {workspaces.map((workspace) => (
        <Box key={workspace.id}>
          <ListItem
            disablePadding
            sx={{
              mb: 0.5,
              borderRadius: designTokens.borderRadius.md,
              overflow: 'hidden',
            }}
          >
            <ListItemButton
              selected={workspace.id === state.selectedWorkspaceId}
              onClick={() => selectWorkspace(workspace.id)}
              sx={{
                borderRadius: designTokens.borderRadius.md,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: workspace.color,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" fontWeight={500}>
                    {workspace.name}
                  </Typography>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={workspace.name}
                  size="small"
                  sx={{
                    minWidth: 24,
                    height: 20,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: alpha(workspace.color, 0.1),
                    color: workspace.color,
                    '& .MuiChip-label': {
                      px: 0.75,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkspaceExpansion(workspace.id);
                  }}
                  sx={{ 
                    width: 24, 
                    height: 24,
                    opacity: 1, // TODO: Check if workspace has sections
                    pointerEvents: 'auto', // TODO: Check if workspace has sections
                  }}
                >
                  {state.expandedWorkspaces.has(workspace.id) ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </IconButton>
              </Box>
            </ListItemButton>
          </ListItem>

          {/* Sections collapse */}
          <Collapse
            in={state.expandedWorkspaces.has(workspace.id)}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding sx={{ pl: 2, pr: 1 }}>
              {/* TODO: Get sections for workspace */}
              {[].map((section: Section) => (
                <ListItem key={section.id} disablePadding>
                  <ListItemButton
                    sx={{
                      py: 0.75,
                      borderRadius: designTokens.borderRadius.sm,
                      '&:hover': {
                        backgroundColor: alpha(section.color, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <TaskIcon 
                        fontSize="small" 
                        sx={{ 
                          color: section.color,
                          fontSize: 16,
                        }} 
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="caption" fontWeight={500}>
                          {section.name}
                        </Typography>
                      }
                    />
                    <Chip 
                      label={section.name}
                      size="small"
                      sx={{
                        minWidth: 20,
                        height: 16,
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        backgroundColor: alpha(section.color, 0.1),
                        color: section.color,
                        '& .MuiChip-label': {
                          px: 0.5,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      ))}
    </List>
  );
};

// Quick navigation section
interface QuickNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  theme: {
    palette: {
      text: { primary: string };
      primary: { main: string };
    };
  };
}

const QuickNavigation: React.FC<QuickNavigationProps> = ({ currentPath, onNavigate, theme }) => {
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      label: "Today's Tasks",
      path: '/today',
      icon: <TodayIcon />,
    },
    {
      label: 'Completed',
      path: '/completed',
      icon: <CompletedIcon />,
    },
    {
      label: 'Activities',
      path: '/activities',
      icon: <ActivitiesIcon />,
    },
  ];

  return (
    <Box sx={{ px: 1, mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          px: 2,
          pb: 1,
          display: 'block',
          color: 'text.secondary',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        Quick Navigation
      </Typography>
      <List sx={{ py: 0 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={currentPath === item.path}
              onClick={() => onNavigate(item.path)}
              sx={{
                borderRadius: designTokens.borderRadius.md,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box sx={{ display: 'flex', color: 'text.secondary' }}>
                  {item.icon}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={500}>
                    {item.label}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

// User profile section
interface UserProfileSectionProps {
  isAuthenticated: boolean;
  user: User | null;
  handleUserMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  userMenuAnchorEl: HTMLElement | null;
  isUserMenuOpen: boolean;
  handleUserMenuClose: () => void;
  handleSettingsClick: () => void;
  handleUserSignOut: () => void;
  theme: {
    palette: {
      text: { primary: string };
      divider: string;
      primary: { main: string };
    };
  };
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({ 
  isAuthenticated, 
  user, 
  handleUserMenuOpen, 
  userMenuAnchorEl, 
  isUserMenuOpen, 
  handleUserMenuClose, 
  handleSettingsClick, 
  handleUserSignOut, 
  theme 
}) => {
  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Not signed in
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <ListItemButton
        onClick={handleUserMenuOpen}
        sx={{
          borderRadius: designTokens.borderRadius.md,
          px: 1.5,
          py: 1,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        <ListItemIcon>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: theme.palette.primary.main,
            }}
          >
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body2" fontWeight={500} noWrap>
              {user.name || 'User'}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          }
        />
      </ListItemButton>

      {/* User menu */}
      <Menu
        anchorEl={userMenuAnchorEl}
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: designTokens.borderRadius.lg,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={handleUserMenuClose} sx={{ borderRadius: designTokens.borderRadius.md }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={handleSettingsClick} sx={{ borderRadius: designTokens.borderRadius.md }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleUserSignOut} sx={{ borderRadius: designTokens.borderRadius.md }}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

// =============================================
// PRESENTER COMPONENT
// =============================================

export const NavigationSidebar: React.FC<NavigationSidebarProps> = React.memo(({ 
  className 
}) => {
  const theme = useTheme();
  const {
    // State
    state,
    
    // User and auth
    user,
    isAuthenticated,
    loading,
    
    // Workspace data
    workspaces,
    
    // Responsive
    isDesktop,
    drawerVariant,
    
    // Actions
    closeSidebar,
    
    // Search
    handleSearchChange,
    clearSearch,
    
    // Navigation
    selectWorkspace,
    toggleWorkspaceExpansion,
    
    // User actions
    handleSettingsClick,
    handleSignOut,
    
    // Quick navigation
    handleQuickNavigation,
    currentPath,
    
    // Resize
    startResizing,
  } = useNavigationSidebar();

  // User menu state
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<HTMLElement | null>(null);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = (): void => {
    setUserMenuAnchorEl(null);
  };

  const handleUserSignOut = async (): Promise<void> => {
    await handleSignOut();
    handleUserMenuClose();
  };

  if (loading) {
    return (
      <Box className={className}>
        <Drawer
          variant={drawerVariant}
          open={true}
          PaperProps={{
            sx: {
              width: state.width,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          }}
        >
          <Box
            sx={{
              width: state.width,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        </Drawer>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Drawer
        variant={drawerVariant}
        open={state.isOpen}
        onClose={closeSidebar}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        PaperProps={{
          sx: {
            borderRadius: drawerVariant === 'temporary' ? `0 ${designTokens.borderRadius.xl}px ${designTokens.borderRadius.xl}px 0` : 0,
            border: drawerVariant !== 'temporary' ? 'none' : undefined,
            boxShadow: drawerVariant === 'temporary' ? '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
            width: state.width,
          },
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            borderRight: drawerVariant !== 'temporary' ? `1px solid ${alpha(theme.palette.divider, 0.12)}` : 'none',
          },
        }}
      >
        <Box
          sx={{
            width: state.width,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            borderRight: drawerVariant !== 'temporary' ? `1px solid ${alpha(theme.palette.divider, 0.12)}` : 'none',
          }}
        >
          {/* Header with search */}
          <Box sx={{ p: 2, pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Workspaces
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThemeToggle />
                <IconButton
                  size="small"
                  onClick={(): void => handleSettingsClick()}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: designTokens.borderRadius.md,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Box>
            </Stack>

            {/* Search bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search workspaces, sections..."
              value={state.searchQuery}
              onChange={(e): void => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: state.searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={(): void => clearSearch()}
                      sx={{ width: 20, height: 20 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: designTokens.borderRadius.md,
                  backgroundColor: alpha(theme.palette.text.primary, 0.02),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.04),
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                  },
                },
              }}
            />
          </Box>

          {/* Quick Navigation */}
          <QuickNavigation
            currentPath={currentPath}
            onNavigate={handleQuickNavigation}
            theme={theme}
          />
          
          <Divider sx={{ mx: 2, mb: 2 }} />

          {/* Workspace list */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <WorkspaceList 
              state={state} 
              workspaces={workspaces} 
              selectWorkspace={selectWorkspace} 
              toggleWorkspaceExpansion={toggleWorkspaceExpansion} 
              theme={theme} 
            />
          </Box>

          {/* Quick actions */}
          <Box sx={{ px: 2, pb: 1 }}>
            <ListItemButton
              sx={{
                borderRadius: designTokens.borderRadius.md,
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <ListItemIcon>
                <AddIcon fontSize="small" sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" color="primary" fontWeight={500}>
                    New Workspace
                  </Typography>
                }
              />
            </ListItemButton>
          </Box>

          {/* User profile section */}
          <Divider sx={{ mx: 2 }} />
          <UserProfileSection 
            isAuthenticated={isAuthenticated}
            user={user}
            handleUserMenuOpen={handleUserMenuOpen}
            userMenuAnchorEl={userMenuAnchorEl}
            isUserMenuOpen={isUserMenuOpen}
            handleUserMenuClose={handleUserMenuClose}
            handleSettingsClick={handleSettingsClick}
            handleUserSignOut={handleUserSignOut}
            theme={theme}
          />

          {/* Resize handle for desktop */}
          {isDesktop && drawerVariant === 'permanent' && (
            <Box
              onMouseDown={startResizing}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 4,
                height: '100%',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                transition: theme.transitions.create('background-color', {
                  duration: theme.transitions.duration.short,
                }),
              }}
            />
          )}
        </Box>
      </Drawer>
    </Box>
  );
});