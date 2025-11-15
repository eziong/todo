// =============================================
// API ERROR HANDLING UTILITIES
// =============================================
// Standardized error handling for API routes

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/database/types';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | string,
  statusCode: number = 500
): NextResponse {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Log error for debugging (but not in production for sensitive errors)
  if (statusCode >= 500) {
    console.error('API Error:', error);
  }

  const response: ApiResponse<null> = {
    data: null,
    error: errorMessage,
    status: statusCode,
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle different error types and return appropriate response
 */
export function handleApiError(error: any): NextResponse {
  // Custom error types
  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, 400);
  }
  
  if (error instanceof AuthenticationError) {
    return createErrorResponse(error.message, 401);
  }
  
  if (error instanceof AuthorizationError) {
    return createErrorResponse(error.message, 403);
  }
  
  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, 404);
  }
  
  if (error instanceof ConflictError) {
    return createErrorResponse(error.message, 409);
  }
  
  if (error instanceof RateLimitError) {
    return createErrorResponse(error.message, 429);
  }

  // Supabase errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return createErrorResponse('Resource not found', 404);
      case 'PGRST301':
        return createErrorResponse('Insufficient permissions', 403);
      case '23505':
        return createErrorResponse('Resource already exists', 409);
      case '23503':
        return createErrorResponse('Related resource not found', 400);
      case '42501':
        return createErrorResponse('Permission denied', 403);
    }
  }

  // Generic error handling
  const message = error.message || 'Internal server error';
  const statusCode = error.statusCode || 500;
  
  return createErrorResponse(message, statusCode);
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    data,
    error: null,
    status: statusCode,
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Validate request method
 */
export function validateMethod(request: Request, allowedMethods: string[]): void {
  if (!allowedMethods.includes(request.method)) {
    throw new ValidationError(
      `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    );
  }
}

/**
 * Parse and validate JSON request body
 */
export async function parseJsonBody(request: Request): Promise<any> {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Extract and validate path parameters
 */
export function validatePathParams(
  params: { [key: string]: string },
  required: string[]
): { [key: string]: string } {
  const missing = required.filter(key => !params[key] || params[key].trim() === '');
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required path parameters: ${missing.join(', ')}`
    );
  }

  // Sanitize and return params
  const sanitized: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(params)) {
    sanitized[key] = value.trim();
  }

  return sanitized;
}

/**
 * Extract and validate query parameters
 */
export function validateQueryParams(
  url: URL,
  schema: { [key: string]: 'string' | 'number' | 'boolean' }
): { [key: string]: any } {
  const params: { [key: string]: any } = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = url.searchParams.get(key);
    
    if (value === null) {
      continue; // Optional parameter
    }

    switch (type) {
      case 'string':
        params[key] = value.trim();
        break;
      case 'number':
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          throw new ValidationError(`Parameter ${key} must be a number`);
        }
        params[key] = numValue;
        break;
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          throw new ValidationError(`Parameter ${key} must be 'true' or 'false'`);
        }
        params[key] = value === 'true';
        break;
    }
  }

  return params;
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): boolean {
  const now = Date.now();
  const limit = rateLimits.get(identifier);

  if (!limit) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > limit.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) {
      rateLimits.delete(key);
    }
  }
}

// Clean up rate limits every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}