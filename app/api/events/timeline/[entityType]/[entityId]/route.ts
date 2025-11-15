// =============================================
// ENTITY ACTIVITY TIMELINE API ROUTE
// =============================================
// API endpoint for fetching entity-specific activity timeline

import { NextRequest, NextResponse } from 'next/server';
import { withAutoEventLogging } from '@/lib/events/middleware';
import { activityQueries } from '@/lib/events/activityQueries';
import { createClient } from '@/lib/supabase/server';
import type { EntityType } from '@/types/database';

async function handler(
  req: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  const supabase = await createClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { entityType, entityId } = params;
    const { searchParams } = new URL(req.url);
    
    // Validate entity type
    const validEntityTypes: EntityType[] = [
      'user', 'workspace', 'workspace_member', 'section', 'task',
      'comment', 'attachment', 'notification', 'integration', 'api_key', 'session'
    ];
    
    if (!validEntityTypes.includes(entityType as EntityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    // Verify entity access based on type
    await verifyEntityAccess(supabase, user.id, entityType as EntityType, entityId);

    // Fetch entity activity timeline
    const timeline = await activityQueries.getEntityActivityTimeline({
      entityType: entityType as EntityType,
      entityId,
      limit
    });

    return NextResponse.json({
      data: timeline,
      entityType,
      entityId,
      total: timeline.length
    });

  } catch (error) {
    console.error('Error fetching entity timeline:', error);
    
    if (error instanceof AccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================
// ACCESS VERIFICATION HELPER
// =============================================

class AccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

async function verifyEntityAccess(
  supabase: any,
  userId: string,
  entityType: EntityType,
  entityId: string
) {
  switch (entityType) {
    case 'user':
      // Users can access their own timeline or profiles of workspace members
      if (entityId !== userId) {
        const { data: membership, error } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', entityId)
          .single();

        if (error || !membership) {
          throw new AccessError('User not found or access denied');
        }

        // Verify current user is in the same workspace
        const { data: userMembership, error: userError } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', membership.workspace_id)
          .eq('user_id', userId)
          .single();

        if (userError || !userMembership) {
          throw new AccessError('Access denied');
        }
      }
      break;

    case 'workspace':
      // Verify user is a member of the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', entityId)
        .eq('user_id', userId)
        .single();

      if (workspaceError || !workspace) {
        throw new AccessError('Workspace not found or access denied');
      }
      break;

    case 'task':
      // Verify user has access to the task's workspace
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('workspace_id')
        .eq('id', entityId)
        .single();

      if (taskError || !task) {
        throw new NotFoundError('Task not found');
      }

      const { data: taskAccess, error: taskAccessError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', task.workspace_id)
        .eq('user_id', userId)
        .single();

      if (taskAccessError || !taskAccess) {
        throw new AccessError('Access denied');
      }
      break;

    case 'section':
      // Verify user has access to the section's workspace
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('workspace_id')
        .eq('id', entityId)
        .single();

      if (sectionError || !section) {
        throw new NotFoundError('Section not found');
      }

      const { data: sectionAccess, error: sectionAccessError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', section.workspace_id)
        .eq('user_id', userId)
        .single();

      if (sectionAccessError || !sectionAccess) {
        throw new AccessError('Access denied');
      }
      break;

    case 'workspace_member':
      // Verify the membership exists and user has access to the workspace
      const { data: member, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('id', entityId)
        .single();

      if (memberError || !member) {
        throw new NotFoundError('Member not found');
      }

      const { data: memberAccess, error: memberAccessError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', member.workspace_id)
        .eq('user_id', userId)
        .single();

      if (memberAccessError || !memberAccess) {
        throw new AccessError('Access denied');
      }
      break;

    default:
      // For other entity types, allow access if user is authenticated
      // Additional access controls can be added as needed
      break;
  }
}

export const GET = withAutoEventLogging(handler, {
  eventType: 'api_call',
  category: 'system',
  skipLogging: true // Skip logging for this endpoint to avoid recursion
});