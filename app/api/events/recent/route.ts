// =============================================
// RECENT EVENTS API ROUTE
// =============================================
// API endpoint for fetching recent activity events

import { NextRequest, NextResponse } from 'next/server';
import { withAutoEventLogging } from '@/lib/events/middleware';
import { activityQueries } from '@/lib/events/activityQueries';
import { createClient } from '@/lib/supabase/server';
import type { EventCategory } from '@/types/database';

async function handler(
  req: NextRequest,
  { params }: { params: { workspaceId?: string } }
) {
  const supabase = createClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const workspaceId = searchParams.get('workspaceId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    
    // Parse categories
    const categoriesParam = searchParams.get('categories');
    let categories: EventCategory[] | undefined;
    if (categoriesParam) {
      try {
        categories = JSON.parse(categoriesParam);
      } catch {
        categories = categoriesParam.split(',') as EventCategory[];
      }
    }

    // Verify workspace access if workspaceId is provided
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json(
          { error: 'Workspace not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Fetch recent activity
    const activity = await activityQueries.getRecentActivity({
      workspaceId,
      userId,
      categories,
      limit,
      offset
    });

    return NextResponse.json({
      data: activity,
      pagination: {
        limit,
        offset,
        hasMore: activity.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching recent events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAutoEventLogging(handler, {
  eventType: 'api_call',
  category: 'system',
  skipLogging: true // Skip logging for this endpoint to avoid recursion
});