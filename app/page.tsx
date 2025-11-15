'use client';

import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { ChecklistRtl as ChecklistIcon } from "@mui/icons-material";
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { UserMenu } from '@/components/Auth/UserMenu/UserMenu';
import { useRouter } from 'next/navigation';
import { designTokens } from '@/theme/utils';

export default function Home(): React.ReactElement {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const handleGetStarted = (): void => {
    if (user) {
      // Navigate to dashboard/workspace
      router.push('/dashboard');
    } else {
      // Navigate to login
      router.push('/login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)",
        padding: 2,
        position: "relative",
      }}
    >
      {/* User Menu - Top Right */}
      {user && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <UserMenu showFullProfile={true} />
        </Box>
      )}
      <Card
        sx={{
          maxWidth: 500,
          width: "100%",
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: designTokens.shadows.medium,
          backdropFilter: "blur(20px)",
          background: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent
          sx={{
            textAlign: "center",
            py: 6,
            px: 4,
          }}
        >
          <Box
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <ChecklistIcon
              sx={{
                fontSize: 48,
                color: "primary.main",
              }}
            />
          </Box>
          
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 2,
              color: "text.primary",
              fontWeight: 700,
            }}
          >
            Todo App
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              color: "text.secondary",
              fontWeight: 400,
            }}
          >
            Workspace Task Manager
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: "text.secondary",
              lineHeight: 1.6,
            }}
          >
            A hierarchical todo application with workspace, section, and task organization. 
            Built with Next.js 14+, TypeScript, and Material UI with macOS-style design.
          </Typography>
          
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 140,
              }}
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 140,
                borderColor: "primary.main",
                color: "primary.main",
              }}
            >
              Learn More
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
