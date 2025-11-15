// =============================================
// SECTION ARCHIVE API ROUTES
// =============================================
// Handles section archive/unarchive operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  ApiResponse 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check user permissions for section via workspace
async function checkSectionPermission(
  supabase: ReturnType<typeof createClient>,
  userId: string, 
  sectionId: string, 
  requiredPermission: 'read' | 'write' | 'delete' | 'admin'
): Promise<{ allowed: boolean; member: any; section: any }> {
  // Get section with workspace info
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id, workspace_id')
    .eq('id', sectionId)
    .eq('is_deleted', false)
    .single();

  if (sectionError || !section) {
    return { allowed: false, member: null, section: null };
  }

  // Check workspace membership and permissions
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', section.workspace_id)
    .eq('user_id', userId)
    .single();

  if (memberError || !member) {
    return { allowed: false, member: null, section };
  }

  const hasPermission = member.permissions[requiredPermission] === true;
  return { allowed: hasPermission, member, section };
}

// POST /api/sections/[id]/archive - Archive section
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has write permission for section
    const { allowed, section: sectionCheck } = await checkSectionPermission(supabase, user.id, sectionId, 'write');
    
    if (!allowed) {
      const status = sectionCheck ? 403 : 404;
      const message = sectionCheck ? 'Forbidden - insufficient permissions' : 'Section not found';
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Parse request body to determine archive action
    const body = await request.json();
    const archive = body.archive !== undefined ? body.archive : true; // Default to archive

    if (typeof archive !== 'boolean') {
      return NextResponse.json(
        { data: null, error: 'Archive parameter must be a boolean', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Get current section state
    const { data: currentSection, error: currentError } = await supabase
      .from('sections')
      .select('id, name, is_archived')
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .single();

    if (currentError) {
      if (currentError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Section not found', status: 404 } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      console.error('Error fetching current section:', currentError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Check if section is already in the desired state
    if (currentSection.is_archived === archive) {
      const action = archive ? 'archived' : 'unarchived';
      return NextResponse.json(
        { 
          data: { 
            id: sectionId, 
            is_archived: archive,
            message: `Section is already ${action}` 
          }, 
          error: null, 
          status: 200 
        } satisfies ApiResponse<{ id: string; is_archived: boolean; message: string }>
      );
    }

    // Archive or unarchive the section
    const { data: updatedSection, error: updateError } = await supabase
      .from('sections')
      .update({ is_archived: archive })
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .select(`
        id,
        workspace_id,
        name,
        description,
        position,
        color,
        is_archived,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating section archive status:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update section archive status', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // If archiving, we need to handle position adjustments for remaining sections
    if (archive) {
      // Get all non-archived sections in the same workspace with higher positions
      const { data: sectionsToReorder, error: reorderError } = await supabase
        .from('sections')
        .select('id, position')
        .eq('workspace_id', updatedSection.workspace_id)
        .eq('is_deleted', false)
        .eq('is_archived', false)
        .gt('position', currentSection.position || 0)
        .order('position', { ascending: true });

      if (reorderError) {
        console.error('Error fetching sections for reordering:', reorderError);
        // Continue anyway as the main operation succeeded
      } else if (sectionsToReorder && sectionsToReorder.length > 0) {
        // Adjust positions by moving them down by 1
        const reorderPromises = sectionsToReorder.map(section => 
          supabase
            .from('sections')
            .update({ position: section.position - 1 })
            .eq('id', section.id)
        );

        try {
          await Promise.all(reorderPromises);
        } catch (reorderingError) {
          console.error('Error reordering sections after archive:', reorderingError);
          // Log but don't fail the main operation
        }
      }
    } else {
      // If unarchiving, move the section to the end
      const { data: maxPositionResult, error: maxPositionError } = await supabase
        .from('sections')
        .select('position')
        .eq('workspace_id', updatedSection.workspace_id)
        .eq('is_deleted', false)
        .eq('is_archived', false)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      if (!maxPositionError && maxPositionResult) {
        const newPosition = maxPositionResult.position + 1;
        await supabase
          .from('sections')
          .update({ position: newPosition })
          .eq('id', sectionId);

        // Update the response data
        updatedSection.position = newPosition;
      }
    }

    const action = archive ? 'archived' : 'unarchived';
    const responseData = {
      ...updatedSection,
      message: `Section successfully ${action}`,
    };

    return NextResponse.json(
      { data: responseData, error: null, status: 200 } satisfies ApiResponse<typeof responseData>
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/sections/[id]/archive:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id]/archive - Unarchive section (alternative endpoint)
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has write permission for section
    const { allowed, section: sectionCheck } = await checkSectionPermission(supabase, user.id, sectionId, 'write');
    
    if (!allowed) {
      const status = sectionCheck ? 403 : 404;
      const message = sectionCheck ? 'Forbidden - insufficient permissions' : 'Section not found';
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Create request body for unarchive operation
    const unarchiveRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ archive: false }),
    });

    // Delegate to POST method with archive: false
    return POST(unarchiveRequest, { params });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/sections/[id]/archive:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}