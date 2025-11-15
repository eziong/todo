# Todo App API Documentation

## Overview

This document provides comprehensive documentation for the Todo App REST API. The API is built using Next.js App Router and provides endpoints for managing workspaces, sections, and tasks.

## Base URL

```
Production: https://your-app.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

The API uses Supabase authentication with JWT tokens. Include the authorization header in all requests:

```bash
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent JSON format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required fields are missing",
    "details": { /* additional error info */ }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Workspaces

### List Workspaces

Get all workspaces for the authenticated user.

```http
GET /api/workspaces
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "description": "Project workspace for team collaboration",
      "color": "#1976d2",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "owner_id": "uuid",
      "member_count": 5,
      "sections_count": 3,
      "tasks_count": 15
    }
  ]
}
```

### Get Workspace

Get a specific workspace by ID.

```http
GET /api/workspaces/{id}
```

**Parameters:**
- `id` (string, required) - Workspace UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Workspace",
    "description": "Project workspace for team collaboration",
    "color": "#1976d2",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "owner_id": "uuid",
    "members": [
      {
        "user_id": "uuid",
        "email": "user@example.com",
        "role": "admin",
        "joined_at": "2024-01-15T10:30:00Z"
      }
    ],
    "sections": [
      {
        "id": "uuid",
        "name": "To Do",
        "position": 0,
        "tasks_count": 5
      }
    ]
  }
}
```

### Create Workspace

Create a new workspace.

```http
POST /api/workspaces
```

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Optional description",
  "color": "#1976d2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Workspace",
    "description": "Optional description",
    "color": "#1976d2",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "owner_id": "uuid"
  },
  "message": "Workspace created successfully"
}
```

### Update Workspace

Update an existing workspace.

```http
PUT /api/workspaces/{id}
```

**Request Body:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description",
  "color": "#2196f3"
}
```

### Delete Workspace

Delete a workspace and all its contents.

```http
DELETE /api/workspaces/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

### Workspace Members

#### List Members

```http
GET /api/workspaces/{id}/members
```

#### Add Member

```http
POST /api/workspaces/{id}/members
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

#### Update Member Role

```http
PUT /api/workspaces/{workspaceId}/members/{userId}
```

**Request Body:**
```json
{
  "role": "admin"
}
```

#### Remove Member

```http
DELETE /api/workspaces/{workspaceId}/members/{userId}
```

---

## Sections

### Get Sections

Get all sections in a workspace.

```http
GET /api/workspaces/{workspaceId}/sections
```

### Create Section

Create a new section in a workspace.

```http
POST /api/sections
```

**Request Body:**
```json
{
  "name": "In Progress",
  "workspace_id": "uuid",
  "position": 1,
  "color": "#ff9800"
}
```

### Update Section

```http
PUT /api/sections/{id}
```

### Update Section Position

```http
PUT /api/sections/{id}/position
```

**Request Body:**
```json
{
  "position": 2
}
```

### Archive Section

```http
POST /api/sections/{id}/archive
```

### Delete Section

```http
DELETE /api/sections/{id}
```

---

## Tasks

### List Tasks

Get tasks with filtering and pagination.

```http
GET /api/tasks?workspace_id={uuid}&section_id={uuid}&status=pending&page=1&limit=20
```

**Query Parameters:**
- `workspace_id` (string) - Filter by workspace
- `section_id` (string) - Filter by section
- `status` (string) - Filter by status (pending, completed, archived)
- `assigned_to` (string) - Filter by assignee
- `due_date` (string) - Filter by due date (YYYY-MM-DD)
- `priority` (string) - Filter by priority (low, medium, high)
- `search` (string) - Search in title and description
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page (max 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Complete user authentication",
        "description": "Implement login and registration",
        "status": "pending",
        "priority": "high",
        "due_date": "2024-01-20",
        "position": 0,
        "section_id": "uuid",
        "workspace_id": "uuid",
        "assigned_to": "uuid",
        "created_by": "uuid",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "completed_at": null,
        "tags": ["authentication", "backend"],
        "attachments": [],
        "comments_count": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Task

Get a specific task by ID.

```http
GET /api/tasks/{id}
```

### Create Task

Create a new task.

```http
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "section_id": "uuid",
  "workspace_id": "uuid",
  "priority": "medium",
  "due_date": "2024-01-25",
  "assigned_to": "uuid",
  "tags": ["feature", "frontend"]
}
```

### Update Task

```http
PUT /api/tasks/{id}
```

### Move Task

Move a task to a different section or position.

```http
PUT /api/tasks/{id}/move
```

**Request Body:**
```json
{
  "section_id": "uuid",
  "position": 2
}
```

### Update Task Status

```http
PUT /api/tasks/{id}/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

### Assign Task

```http
PUT /api/tasks/{id}/assign
```

**Request Body:**
```json
{
  "assigned_to": "uuid"
}
```

### Duplicate Task

```http
POST /api/tasks/{id}/duplicate
```

### Archive Task

```http
POST /api/tasks/{id}/archive
```

### Delete Task

```http
DELETE /api/tasks/{id}
```

---

## Events & Activity

### Get Recent Events

Get recent activity events.

```http
GET /api/events/recent?limit=50&workspace_id={uuid}
```

### Get Timeline

Get activity timeline for an entity.

```http
GET /api/events/timeline/{entityType}/{entityId}
```

**Parameters:**
- `entityType` - task, section, or workspace
- `entityId` - UUID of the entity

---

## Search

### Search Tasks

Full-text search across tasks.

```http
GET /api/tasks/search?q=authentication&workspace_id={uuid}
```

**Query Parameters:**
- `q` (string, required) - Search query
- `workspace_id` (string) - Limit to specific workspace
- `filters` (string) - JSON encoded filter object
- `sort` (string) - Sort field (relevance, created_at, due_date)
- `order` (string) - Sort order (asc, desc)

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "title": "Title is required",
      "due_date": "Invalid date format"
    }
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Valid authentication token required"
  }
}
```

**Permission Error (403):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to perform this action"
  }
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found"
  }
}
```

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints:** 100 requests per minute per user
- **Search endpoints:** 30 requests per minute per user
- **File upload:** 10 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

---

## Webhooks

Configure webhooks to receive real-time notifications about events.

### Supported Events

- `task.created`
- `task.updated`
- `task.completed`
- `task.deleted`
- `section.created`
- `section.updated`
- `workspace.created`
- `workspace.updated`
- `member.added`
- `member.removed`

### Webhook Payload

```json
{
  "event": "task.completed",
  "data": {
    "id": "uuid",
    "title": "Complete user authentication",
    "workspace_id": "uuid",
    "completed_at": "2024-01-15T10:30:00Z"
  },
  "workspace_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'your-supabase-url',
  'your-supabase-anon-key'
)

// Get user token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Make API request
const response = await fetch('/api/workspaces', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()
```

### Python

```python
import requests

headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://your-app.vercel.app/api/workspaces',
    headers=headers
)

data = response.json()
```

### cURL

```bash
curl -H "Authorization: Bearer your-jwt-token" \
     -H "Content-Type: application/json" \
     https://your-app.vercel.app/api/workspaces
```

---

## Testing

Use the following test endpoints in development:

- Health check: `GET /api/health`
- Echo test: `POST /api/test/echo`
- Authentication test: `GET /api/test/auth`

---

## Support

For API support and questions:
- Email: api-support@todoapp.com
- Documentation: https://docs.todoapp.com
- Issues: https://github.com/your-repo/issues