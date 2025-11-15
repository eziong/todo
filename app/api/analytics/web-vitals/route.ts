import { NextRequest, NextResponse } from 'next/server';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalsMetric = await request.json();

    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // In production, you would send this to your analytics service
    // For example: Google Analytics, Mixpanel, or custom analytics
    
    // Log metric for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vitals - ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id
      });
    }

    // Send to external analytics service
    const analyticsPromises = [];

    // Send to Google Analytics 4 (if configured)
    if (process.env.GA_MEASUREMENT_ID) {
      analyticsPromises.push(
        fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
          method: 'POST',
          body: JSON.stringify({
            client_id: request.headers.get('x-client-id') || 'anonymous',
            events: [{
              name: 'web_vitals',
              params: {
                metric_name: metric.name,
                metric_value: Math.round(metric.value),
                metric_rating: metric.rating,
                custom_parameter_1: metric.id
              }
            }]
          })
        })
      );
    }

    // Send to custom analytics endpoint (if configured)
    if (process.env.ANALYTICS_ENDPOINT) {
      analyticsPromises.push(
        fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
          },
          body: JSON.stringify({
            event: 'web_vitals',
            timestamp: new Date().toISOString(),
            metric,
            user_agent: request.headers.get('user-agent'),
            referer: request.headers.get('referer')
          })
        })
      );
    }

    // Wait for analytics calls to complete (with timeout)
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analytics timeout')), 5000)
    );

    try {
      await Promise.race([
        Promise.allSettled(analyticsPromises),
        timeout
      ]);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Analytics error:', error);
    }

    return NextResponse.json({ 
      success: true,
      metric: metric.name,
      value: metric.value,
      rating: metric.rating
    });

  } catch (error) {
    console.error('Web Vitals API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}