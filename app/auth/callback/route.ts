// =============================================
// AUTH CALLBACK ROUTE HANDLER
// =============================================
// Handles OAuth callback redirects from Supabase

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle OAuth callback from Supabase Auth
 * Exchanges the auth code for a session and redirects to the app
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Successful authentication - redirect to the app
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        if (isLocalEnv) {
          // In development, redirect to localhost
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          // In production with forwarded host
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          // Fallback to origin
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    } catch {
      // Auth callback error - logging suppressed for security
    }
  }

  // If there's an error or no code, redirect to auth error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}