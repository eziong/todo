'use client';

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMonitorProps {
  enabled?: boolean;
  debug?: boolean;
}

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  enabled = true, 
  debug = false 
}) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const sendToAnalytics = (metric: WebVitalsMetric) => {
      // Send to analytics service
      if (debug) {
        console.log('Web Vitals:', metric);
      }

      // Send to Vercel Analytics if available
      if (window.va) {
        window.va('track', 'Web Vitals', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating
        });
      }

      // Send to custom analytics endpoint
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      }).catch((error) => {
        if (debug) {
          console.error('Failed to send Web Vitals:', error);
        }
      });
    };

    // Collect Web Vitals metrics
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);

    // Custom performance metrics
    const measureCustomMetrics = () => {
      if (performance.mark && performance.measure) {
        // Measure React hydration time
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const navigation = navigationEntries[0];
          
          // Time to Interactive approximation
          const tti = navigation.domInteractive - navigation.navigationStart;
          
          sendToAnalytics({
            id: 'tti',
            name: 'TTI',
            value: tti,
            delta: tti,
            rating: tti < 3800 ? 'good' : tti < 7300 ? 'needs-improvement' : 'poor'
          });

          // Total Blocking Time approximation
          const longTasks = performance.getEntriesByType('longtask') as PerformanceEntry[];
          const tbt = longTasks.reduce((total, task) => {
            const blockingTime = Math.max(0, task.duration - 50);
            return total + blockingTime;
          }, 0);

          if (tbt > 0) {
            sendToAnalytics({
              id: 'tbt',
              name: 'TBT',
              value: tbt,
              delta: tbt,
              rating: tbt < 200 ? 'good' : tbt < 600 ? 'needs-improvement' : 'poor'
            });
          }
        }
      }
    };

    // Measure custom metrics after page load
    if (document.readyState === 'complete') {
      measureCustomMetrics();
    } else {
      window.addEventListener('load', measureCustomMetrics);
      return () => window.removeEventListener('load', measureCustomMetrics);
    }
  }, [enabled, debug]);

  // Component doesn't render anything
  return null;
};