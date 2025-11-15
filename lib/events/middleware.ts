// =============================================
// EVENT LOGGING MIDDLEWARE
// =============================================
// Middleware for automatically setting request context for event logging

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================
// REQUEST CONTEXT INTERFACE
// =============================================

export interface RequestContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'web' | 'api' | 'mobile';
  pathname: string;
  method: string;
}

// =============================================
// CONTEXT STORAGE
// =============================================

// Use AsyncLocalStorage for request-scoped context
import { AsyncLocalStorage } from 'async_hooks';
const requestContextStore = new AsyncLocalStorage<RequestContext>();

// =============================================
// MIDDLEWARE FUNCTIONS
// =============================================

export function withEventContext(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const context = await createRequestContext(req);
    
    return requestContextStore.run(context, async () => {
      // Set context in Supabase session for database functions
      const supabase = await createClient();
      
      try {
        if (context.userId) {
          await supabase.rpc('set_session_context', {
            user_id: context.userId,
            session_id: context.sessionId,
            ip_address: context.ipAddress,
            user_agent: context.userAgent,
            source: context.source
          });
        }
      } catch (error) {
        console.warn('Failed to set session context:', error);
      }

      return handler(req, ...args);
    });
  };
}

async function createRequestContext(req: NextRequest): Promise<RequestContext> {
  const supabase = await createClient();
  let userId: string | undefined;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch (error) {
    // User not authenticated, continue without user context
  }

  // Detect source based on headers and path
  const userAgent = req.headers.get('user-agent') || '';
  const isAPI = req.nextUrl.pathname.startsWith('/api/');
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  let source: 'web' | 'api' | 'mobile' = 'web';
  if (isAPI) {
    source = 'api';
  } else if (isMobile) {
    source = 'mobile';
  }

  // Get real IP address considering proxies
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';

  // Generate or extract session ID
  const sessionId = req.headers.get('x-session-id') || generateSessionId();

  return {
    userId,
    sessionId,
    ipAddress,
    userAgent,
    source,
    pathname: req.nextUrl.pathname,
    method: req.method
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// =============================================
// CONTEXT ACCESS FUNCTIONS
// =============================================

export function getCurrentRequestContext(): RequestContext | undefined {
  return requestContextStore.getStore();
}

export function getCurrentUserId(): string | undefined {
  return getCurrentRequestContext()?.userId;
}

export function getCurrentSessionId(): string | undefined {
  return getCurrentRequestContext()?.sessionId;
}

export function getCurrentIPAddress(): string | undefined {
  return getCurrentRequestContext()?.ipAddress;
}

export function getCurrentUserAgent(): string | undefined {
  return getCurrentRequestContext()?.userAgent;
}

export function getCurrentSource(): 'web' | 'api' | 'mobile' | undefined {
  return getCurrentRequestContext()?.source;
}

// =============================================
// API ROUTE WRAPPER
// =============================================

export function withEventLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withEventContext(handler);
}

// =============================================
// AUTOMATIC EVENT LOGGING FOR API ROUTES
// =============================================

interface APIEventOptions {
  eventType?: string;
  entityType?: string;
  category?: string;
  skipLogging?: boolean;
  sensitiveData?: boolean;
}

export function withAutoEventLogging(
  handler: Function,
  options: APIEventOptions = {}
) {
  return withEventContext(async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const context = getCurrentRequestContext();
    
    let response: NextResponse;
    let error: Error | null = null;
    
    try {
      response = await handler(req, ...args);
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      throw err;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Skip logging if requested or for sensitive operations
      if (!options.skipLogging && !options.sensitiveData && context?.userId) {
        try {
          await logAPIEvent({
            context,
            method: req.method,
            pathname: req.nextUrl.pathname,
            duration,
            error,
            options
          });
        } catch (logError) {
          console.warn('Failed to log API event:', logError);
        }
      }
    }

    return response!;
  });
}

async function logAPIEvent({
  context,
  method,
  pathname,
  duration,
  error,
  options
}: {
  context: RequestContext;
  method: string;
  pathname: string;
  duration: number;
  error: Error | null;
  options: APIEventOptions;
}) {
  const supabase = await createClient();

  const eventType = error ? 'api_error' : 'api_call';
  const category = error ? 'error' : 'system';
  const severity = error ? 'error' : 'debug';

  const eventContext = {
    method,
    pathname,
    duration_ms: duration,
    error_message: error?.message,
    error_stack: error?.stack,
    source: context.source
  };

  try {
    await supabase.rpc('log_enhanced_event', {
      p_user_id: context.userId,
      p_event_type: eventType,
      p_entity_type: 'session',
      p_category: options.category || category,
      p_severity: severity,
      p_source: context.source,
      p_context: eventContext,
      p_tags: [method.toLowerCase(), 'api', pathname.split('/')[2] || 'unknown'],
      p_ip_address: context.ipAddress,
      p_user_agent: context.userAgent,
      p_session_id: context.sessionId
    });
  } catch (logError) {
    console.error('Failed to log API event to database:', logError);
  }
}

// =============================================
// DATABASE FUNCTION FOR SETTING CONTEXT
// =============================================

// Note: This function should be added to the database migration
export const SET_SESSION_CONTEXT_FUNCTION = `
CREATE OR REPLACE FUNCTION set_session_context(
    user_id UUID DEFAULT NULL,
    session_id TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    source TEXT DEFAULT 'web'
)
RETURNS VOID AS $$
BEGIN
    -- Set session variables for use in triggers
    PERFORM set_config('app.current_user_id', COALESCE(user_id::text, ''), true);
    PERFORM set_config('app.session_id', COALESCE(session_id, ''), true);
    PERFORM set_config('app.client_ip', COALESCE(ip_address::text, ''), true);
    PERFORM set_config('app.user_agent', COALESCE(user_agent, ''), true);
    PERFORM set_config('app.request_source', COALESCE(source, 'web'), true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// =============================================
// REACT HOOKS FOR CLIENT-SIDE CONTEXT
// =============================================

export function useEventContext() {
  const setRequestContext = (context: Partial<RequestContext>) => {
    // Store context in sessionStorage for client-side access
    if (typeof window !== 'undefined') {
      const existingContext = JSON.parse(
        sessionStorage.getItem('eventContext') || '{}'
      );
      const newContext = { ...existingContext, ...context };
      sessionStorage.setItem('eventContext', JSON.stringify(newContext));
    }
  };

  const getRequestContext = (): Partial<RequestContext> => {
    if (typeof window === 'undefined') return {};
    
    return JSON.parse(
      sessionStorage.getItem('eventContext') || '{}'
    );
  };

  const generateSessionId = () => {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  return {
    setRequestContext,
    getRequestContext,
    generateSessionId
  };
}

// =============================================
// CLIENT-SIDE EVENT CONTEXT PROVIDER
// =============================================

// Re-export client-side context provider from components
export { EventContextProvider, useClientEventContext } from '@/components/EventProvider/EventProvider';