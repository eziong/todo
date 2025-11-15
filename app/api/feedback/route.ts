import { NextRequest, NextResponse } from 'next/server';

interface FeedbackData {
  type: 'bug' | 'improvement' | 'question' | 'other';
  rating?: number;
  title: string;
  description: string;
  email?: string;
  category: string;
  metadata: {
    url: string;
    userAgent: string;
    timestamp: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: FeedbackData = await request.json();

    // Validate required fields
    if (!feedbackData.title || !feedbackData.description || !feedbackData.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Enhanced feedback data with server context
    const enhancedFeedback = {
      ...feedbackData,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serverTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      request: {
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        country: request.headers.get('cf-ipcountry') || 'unknown',
        referer: request.headers.get('referer'),
      }
    };

    // Log feedback for debugging
    console.log('Feedback received:', {
      id: enhancedFeedback.id,
      type: enhancedFeedback.type,
      title: enhancedFeedback.title,
      rating: enhancedFeedback.rating
    });

    // Process feedback
    const promises = [];

    // Store in database
    promises.push(storeFeedback(enhancedFeedback));

    // Send email notification for high-priority feedback
    if (shouldNotifyTeam(enhancedFeedback)) {
      promises.push(notifyTeamAboutFeedback(enhancedFeedback));
    }

    // Send to analytics service
    promises.push(trackFeedbackAnalytics(enhancedFeedback));

    // Auto-respond via email if email provided
    if (enhancedFeedback.email) {
      promises.push(sendAutoResponse(enhancedFeedback));
    }

    // Wait for all operations with timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Processing timeout')), 8000)
    );

    try {
      await Promise.race([
        Promise.allSettled(promises),
        timeout
      ]);
    } catch (error) {
      console.error('Feedback processing failed:', error);
      // Don't fail the request if processing fails
    }

    return NextResponse.json({ 
      success: true,
      feedbackId: enhancedFeedback.id,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Feedback API failed:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

// Store feedback in database
async function storeFeedback(feedback: any) {
  try {
    // In a real implementation, store in your database
    // For example, using Supabase:
    
    // const supabase = createClient();
    // await supabase
    //   .from('feedback')
    //   .insert({
    //     feedback_id: feedback.id,
    //     type: feedback.type,
    //     title: feedback.title,
    //     description: feedback.description,
    //     rating: feedback.rating,
    //     email: feedback.email,
    //     category: feedback.category,
    //     url: feedback.metadata.url,
    //     user_agent: feedback.metadata.userAgent,
    //     timestamp: feedback.metadata.timestamp,
    //     server_timestamp: feedback.serverTimestamp,
    //     environment: feedback.environment,
    //     version: feedback.version,
    //     ip_address: feedback.request.ip,
    //     country: feedback.request.country,
    //   });

    console.log('Feedback stored (simulated):', feedback.id);
  } catch (error) {
    console.error('Failed to store feedback:', error);
  }
}

// Determine if team should be notified
function shouldNotifyTeam(feedback: any): boolean {
  // Notify for bugs and low ratings
  if (feedback.type === 'bug') return true;
  if (feedback.rating && feedback.rating <= 2) return true;
  
  // Notify for production feedback
  if (process.env.NODE_ENV === 'production') {
    return feedback.type === 'bug' || (feedback.rating && feedback.rating <= 3);
  }
  
  return false;
}

// Notify team about feedback
async function notifyTeamAboutFeedback(feedback: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = feedback.type === 'bug' ? '🐛' : 
                feedback.type === 'improvement' ? '💡' : 
                feedback.type === 'question' ? '❓' : '💬';

  const color = feedback.type === 'bug' ? 'danger' : 
                feedback.rating && feedback.rating <= 2 ? 'warning' : 'good';

  const message = {
    text: `${emoji} New Feedback Received`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Type',
            value: feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1),
            short: true
          },
          {
            title: 'Rating',
            value: feedback.rating ? `${feedback.rating}/5 ⭐` : 'N/A',
            short: true
          },
          {
            title: 'Title',
            value: feedback.title,
            short: false
          },
          {
            title: 'Description',
            value: feedback.description.length > 200 ? 
                   feedback.description.substring(0, 200) + '...' : 
                   feedback.description,
            short: false
          },
          {
            title: 'URL',
            value: feedback.metadata.url,
            short: true
          },
          {
            title: 'Category',
            value: feedback.category || 'General',
            short: true
          },
          {
            title: 'Contact',
            value: feedback.email || 'Anonymous',
            short: true
          },
          {
            title: 'Environment',
            value: feedback.environment,
            short: true
          }
        ],
        footer: `Feedback ID: ${feedback.id}`,
        ts: Math.floor(Date.parse(feedback.serverTimestamp) / 1000)
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
    console.error('Failed to notify team about feedback:', error);
  }
}

// Track feedback in analytics
async function trackFeedbackAnalytics(feedback: any) {
  try {
    // Send to analytics service
    const analyticsData = {
      event: 'feedback_submitted',
      properties: {
        feedback_type: feedback.type,
        rating: feedback.rating,
        category: feedback.category,
        environment: feedback.environment,
        has_email: !!feedback.email,
        title_length: feedback.title.length,
        description_length: feedback.description.length,
      },
      timestamp: feedback.serverTimestamp
    };

    // Send to Google Analytics, Mixpanel, or other analytics service
    console.log('Analytics tracked (simulated):', analyticsData);
  } catch (error) {
    console.error('Failed to track feedback analytics:', error);
  }
}

// Send auto-response email
async function sendAutoResponse(feedback: any) {
  if (!feedback.email) return;

  try {
    const emailData = {
      to: feedback.email,
      subject: `Thank you for your feedback - ${feedback.title}`,
      html: `
        <h2>Thank you for your feedback!</h2>
        <p>We received your ${feedback.type} feedback and appreciate you taking the time to help us improve.</p>
        
        <h3>Your feedback:</h3>
        <p><strong>Title:</strong> ${feedback.title}</p>
        <p><strong>Type:</strong> ${feedback.type}</p>
        ${feedback.rating ? `<p><strong>Rating:</strong> ${feedback.rating}/5 stars</p>` : ''}
        
        <p>We'll review your feedback and get back to you if needed.</p>
        
        <p>Best regards,<br>The Todo App Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          Reference ID: ${feedback.id}<br>
          Submitted: ${feedback.serverTimestamp}
        </p>
      `
    };

    // In a real implementation, send via email service like SendGrid, etc.
    console.log('Auto-response email sent (simulated):', emailData.to);
  } catch (error) {
    console.error('Failed to send auto-response email:', error);
  }
}