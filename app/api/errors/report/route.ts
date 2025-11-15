import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  buildVersion?: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();

    // Validate required fields
    if (!errorReport.errorId || !errorReport.message || !errorReport.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Enhanced error report with additional context
    const enhancedReport = {
      ...errorReport,
      serverTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      deployment: {
        version: process.env.NEXT_PUBLIC_APP_VERSION,
        commit: process.env.VERCEL_GIT_COMMIT_SHA,
        branch: process.env.VERCEL_GIT_COMMIT_REF,
      },
      request: {
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        country: request.headers.get('cf-ipcountry') || 'unknown',
        referer: request.headers.get('referer'),
      }
    };

    // Log error for debugging
    console.error('Error Report Received:', {
      errorId: enhancedReport.errorId,
      message: enhancedReport.message,
      url: enhancedReport.url,
      timestamp: enhancedReport.timestamp
    });

    // Send to error monitoring services
    const promises = [];

    // Send to Sentry (if configured)
    if (process.env.SENTRY_DSN) {
      promises.push(sendToSentry(enhancedReport));
    }

    // Send to custom logging service (if configured)
    if (process.env.LOGGING_ENDPOINT) {
      promises.push(sendToCustomLogger(enhancedReport));
    }

    // Send to Slack/Discord (for critical errors)
    if (shouldNotifyTeam(enhancedReport)) {
      promises.push(notifyTeam(enhancedReport));
    }

    // Store in database (implement based on your needs)
    promises.push(storeErrorReport(enhancedReport));

    // Wait for all reporting attempts with timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Reporting timeout')), 10000)
    );

    try {
      await Promise.race([
        Promise.allSettled(promises),
        timeout
      ]);
    } catch (error) {
      console.error('Error reporting failed:', error);
      // Don't fail the request if reporting fails
    }

    return NextResponse.json({ 
      success: true,
      errorId: errorReport.errorId,
      reported: true
    });

  } catch (error) {
    console.error('Error report API failed:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

// Send error to Sentry
async function sendToSentry(errorReport: ErrorReport) {
  if (!process.env.SENTRY_DSN) return;

  try {
    const sentryPayload = {
      message: errorReport.message,
      level: 'error',
      timestamp: errorReport.timestamp,
      user: errorReport.userId ? { id: errorReport.userId } : undefined,
      tags: {
        errorId: errorReport.errorId,
        version: errorReport.buildVersion,
        environment: process.env.NODE_ENV,
      },
      extra: {
        stack: errorReport.stack,
        componentStack: errorReport.componentStack,
        url: errorReport.url,
        userAgent: errorReport.userAgent,
      }
    };

    // Implement Sentry API call here
    // This would typically use Sentry's SDK
    console.log('Would send to Sentry:', sentryPayload);
  } catch (error) {
    console.error('Failed to send to Sentry:', error);
  }
}

// Send to custom logging service
async function sendToCustomLogger(errorReport: ErrorReport) {
  if (!process.env.LOGGING_ENDPOINT || !process.env.LOGGING_API_KEY) return;

  try {
    const response = await fetch(process.env.LOGGING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`,
      },
      body: JSON.stringify({
        level: 'error',
        service: 'todo-app',
        ...errorReport
      }),
    });

    if (!response.ok) {
      throw new Error(`Logging service responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send to custom logger:', error);
  }
}

// Determine if team should be notified immediately
function shouldNotifyTeam(errorReport: ErrorReport): boolean {
  // Notify for production errors
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  // Notify for specific error patterns
  const criticalPatterns = [
    /database/i,
    /authentication/i,
    /payment/i,
    /security/i,
    /unauthorized/i
  ];

  return criticalPatterns.some(pattern => 
    pattern.test(errorReport.message) || 
    pattern.test(errorReport.stack || '')
  );
}

// Notify team via Slack or Discord
async function notifyTeam(errorReport: ErrorReport) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    text: '🚨 Application Error Detected',
    attachments: [
      {
        color: 'danger',
        fields: [
          {
            title: 'Error ID',
            value: errorReport.errorId,
            short: true
          },
          {
            title: 'Message',
            value: errorReport.message,
            short: false
          },
          {
            title: 'URL',
            value: errorReport.url,
            short: true
          },
          {
            title: 'Time',
            value: errorReport.timestamp,
            short: true
          },
          {
            title: 'User',
            value: errorReport.userId || 'Anonymous',
            short: true
          },
          {
            title: 'Environment',
            value: process.env.NODE_ENV,
            short: true
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to notify team:', error);
  }
}

// Store error report in database
async function storeErrorReport(errorReport: ErrorReport) {
  try {
    // In a real implementation, you would store this in your database
    // For example, using Supabase:
    
    // const supabase = await createClient();
    // await supabase
    //   .from('error_reports')
    //   .insert({
    //     error_id: errorReport.errorId,
    //     message: errorReport.message,
    //     stack: errorReport.stack,
    //     component_stack: errorReport.componentStack,
    //     timestamp: errorReport.timestamp,
    //     user_agent: errorReport.userAgent,
    //     url: errorReport.url,
    //     user_id: errorReport.userId,
    //     build_version: errorReport.buildVersion,
    //     environment: process.env.NODE_ENV,
    //   });

    console.log('Error report stored (simulated):', errorReport.errorId);
  } catch (error) {
    console.error('Failed to store error report:', error);
  }
}