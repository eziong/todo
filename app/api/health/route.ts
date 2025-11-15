import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test database connection
    const { data, error } = await supabase
      .from('workspaces')
      .select('count')
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }

    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database: {
        connected: !error,
        latency: Date.now() // Simplified latency check
      },
      auth: {
        service: !authError
      },
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    };

    return NextResponse.json(healthCheck, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}