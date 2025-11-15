// =============================================
// SECTION POSITION API ROUTES
// =============================================
// Handles section position reordering within workspace

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSectionReorder } from '@/lib/validation/section';
import type { 
  ApiResponse,
  Section
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check user permissions for section via workspace
async function checkSectionPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

// PUT /api/sections/[id]/position - Reorder sections within workspace
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Parse and validate request body
    const body = await request.json();
    
    const validation = validateSectionReorder(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { data: null, error: validation.errors.join(', '), status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const { sections } = validation.sanitizedData as { sections: Array<{ id: string; position: number }> };

    // Get workspace ID from the current section
    const { data: currentSection, error: currentSectionError } = await supabase
      .from('sections')
      .select('workspace_id')
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .single();

    if (currentSectionError) {
      console.error('Error fetching current section:', currentSectionError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch section details', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Verify all sections belong to the same workspace
    const sectionIds = sections.map(s => s.id);
    const { data: workspaceSections, error: workspaceSectionsError } = await supabase
      .from('sections')
      .select('id, workspace_id')
      .in('id', sectionIds)
      .eq('is_deleted', false);

    if (workspaceSectionsError) {
      console.error('Error verifying sections:', workspaceSectionsError);
      return NextResponse.json(
        { data: null, error: 'Failed to verify section workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Check that all sections exist and belong to the same workspace
    if (workspaceSections.length !== sectionIds.length) {
      return NextResponse.json(
        { data: null, error: 'One or more sections not found', status: 404 } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    const allSameWorkspace = workspaceSections.every(s => s.workspace_id === currentSection.workspace_id);
    if (!allSameWorkspace) {
      return NextResponse.json(
        { data: null, error: 'All sections must belong to the same workspace', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Get all sections in the workspace to verify complete reordering
    const { data: allWorkspaceSections, error: allSectionsError } = await supabase
      .from('sections')
      .select('id')
      .eq('workspace_id', currentSection.workspace_id)
      .eq('is_deleted', false)
      .eq('is_archived', false); // Only reorder non-archived sections

    if (allSectionsError) {
      console.error('Error fetching all workspace sections:', allSectionsError);
      return NextResponse.json(
        { data: null, error: 'Failed to verify workspace sections', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    const allWorkspaceSectionIds = allWorkspaceSections.map(s => s.id).sort();
    const providedSectionIds = sectionIds.sort();

    // Check if all non-archived sections are included in the reorder
    if (allWorkspaceSectionIds.length !== providedSectionIds.length || 
        !allWorkspaceSectionIds.every(id => providedSectionIds.includes(id))) {
      return NextResponse.json(
        { data: null, error: 'Must include all non-archived sections in reorder operation', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Update positions in a transaction-like manner
    const updates = sections.map(section => ({
      id: section.id,
      position: section.position,
    }));

    try {
      // Update all sections in a batch
      const updatePromises = updates.map(update =>
        supabase
          .from('sections')
          .update({ position: update.position })
          .eq('id', update.id)
          .eq('workspace_id', currentSection.workspace_id)
          .eq('is_deleted', false)
      );

      await Promise.all(updatePromises);

      // Verify the update was successful by fetching updated sections
      const { data: updatedSections, error: verifyError } = await supabase
        .from('sections')
        .select(`
          id,
          workspace_id,
          name,
          description,
          position,
          color,
          is_archived,
          is_deleted,
          created_at,
          updated_at
        `)
        .eq('workspace_id', currentSection.workspace_id)
        .eq('is_deleted', false)
        .order('position', { ascending: true });

      if (verifyError) {
        console.error('Error verifying section updates:', verifyError);
        return NextResponse.json(
          { data: null, error: 'Failed to verify position updates', status: 500 } satisfies ApiResponse<null>,
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          data: { 
            updated: true, 
            sections: updatedSections,
            workspace_id: currentSection.workspace_id 
          }, 
          error: null, 
          status: 200 
        } satisfies ApiResponse<{ updated: boolean; sections: Section[]; workspace_id: string }>
      );

    } catch (updateError) {
      console.error('Error updating section positions:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update section positions', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in PUT /api/sections/[id]/position:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}