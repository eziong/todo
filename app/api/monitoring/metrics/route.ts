import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SystemMetrics {
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  health: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    authentication: 'healthy' | 'warning' | 'error';
    external: 'healthy' | 'warning' | 'error';
  };
  errors: Array<{
    id: string;
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
  }>;
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Collect system metrics
    const metrics: SystemMetrics = {
      performance: await collectPerformanceMetrics(),
      resources: await collectResourceMetrics(),
      health: await collectHealthMetrics(),
      errors: await collectRecentErrors(),
      webVitals: await collectWebVitalsMetrics()
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ...metrics,
      metadata: {
        collectedAt: new Date().toISOString(),
        responseTime,
        environment: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION
      }
    });

  } catch (error) {
    console.error('Failed to collect system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect system metrics' },
      { status: 500 }
    );
  }
}

// Collect performance metrics
async function collectPerformanceMetrics() {
  try {
    // In a real implementation, these would come from:
    // - Application Performance Monitoring (APM) tools
    // - Server monitoring
    // - Database query logs
    // - Load balancer metrics

    // Simulated metrics for demo
    const baseResponseTime = 150;
    const responseTime = baseResponseTime + (Math.random() * 100);
    
    const baseThroughput = 45;
    const throughput = baseThroughput + (Math.random() * 20 - 10);
    
    const baseErrorRate = 0.5;
    const errorRate = Math.max(0, baseErrorRate + (Math.random() * 2 - 1));
    
    const uptime = 99.5 + (Math.random() * 0.5);

    return {
      responseTime: Math.round(responseTime),
      throughput: Math.round(throughput * 10) / 10,
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: Math.round(uptime * 100) / 100
    };
  } catch (error) {
    console.error('Failed to collect performance metrics:', error);
    return {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      uptime: 0
    };
  }
}

// Collect resource metrics
async function collectResourceMetrics() {
  try {
    // In production, these would come from:
    // - Server monitoring tools (New Relic, DataDog, etc.)
    // - System resource APIs
    // - Cloud provider APIs (AWS CloudWatch, etc.)

    // Get memory usage from Node.js
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Simulated metrics
    const cpuUsage = 15 + (Math.random() * 30); // 15-45%
    const diskUsage = 60 + (Math.random() * 20); // 60-80%
    const networkLatency = 10 + (Math.random() * 20); // 10-30ms

    return {
      memoryUsage: Math.round(memoryUsagePercent),
      cpuUsage: Math.round(cpuUsage),
      diskUsage: Math.round(diskUsage),
      networkLatency: Math.round(networkLatency)
    };
  } catch (error) {
    console.error('Failed to collect resource metrics:', error);
    return {
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkLatency: 0
    };
  }
}

// Collect health check metrics
async function collectHealthMetrics() {
  const health: SystemMetrics['health'] = {
    database: 'healthy',
    api: 'healthy',
    authentication: 'healthy',
    external: 'healthy'
  };

  try {
    // Test database connection
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('workspaces')
      .select('count')
      .limit(1)
      .single();
    
    if (dbError) {
      health.database = 'error';
    }

    // Test authentication service
    const { error: authError } = await supabase.auth.getUser();
    if (authError && authError.message !== 'No user') {
      health.authentication = 'warning';
    }

    // Test external services (simulated)
    const externalServiceLatency = Math.random() * 1000;
    if (externalServiceLatency > 800) {
      health.external = 'warning';
    } else if (externalServiceLatency > 1200) {
      health.external = 'error';
    }

    // API health is determined by overall system state
    const hasErrors = Object.values(health).some(status => status === 'error');
    const hasWarnings = Object.values(health).some(status => status === 'warning');
    
    if (hasErrors) {
      health.api = 'error';
    } else if (hasWarnings) {
      health.api = 'warning';
    }

  } catch (error) {
    console.error('Health check failed:', error);
    health.database = 'error';
    health.api = 'error';
  }

  return health;
}

// Collect recent errors
async function collectRecentErrors() {
  try {
    // In production, this would query your error logging system
    // For now, return simulated recent errors
    
    const errors = [];
    const errorCount = Math.floor(Math.random() * 3);
    
    const sampleErrors = [
      { 
        message: 'Database connection timeout',
        severity: 'high' as const,
        count: 3
      },
      { 
        message: 'Rate limit exceeded for user authentication',
        severity: 'medium' as const,
        count: 1
      },
      { 
        message: 'External API service unavailable',
        severity: 'low' as const,
        count: 5
      }
    ];

    for (let i = 0; i < errorCount; i++) {
      const sampleError = sampleErrors[i % sampleErrors.length];
      errors.push({
        id: `error_${Date.now()}_${i}`,
        timestamp: new Date(Date.now() - (i * 300000)).toISOString(), // 5 min intervals
        message: sampleError.message,
        severity: sampleError.severity,
        count: sampleError.count
      });
    }

    return errors;
  } catch (error) {
    console.error('Failed to collect error metrics:', error);
    return [];
  }
}

// Collect Web Vitals metrics
async function collectWebVitalsMetrics() {
  try {
    // In production, these would be aggregated from:
    // - Real user monitoring (RUM)
    // - Web Vitals API reports
    // - Analytics services

    // Simulated Web Vitals based on typical good performance
    const lcp = 1800 + (Math.random() * 1000); // 1.8-2.8s
    const fid = 50 + (Math.random() * 100); // 50-150ms
    const cls = 0.05 + (Math.random() * 0.1); // 0.05-0.15
    const fcp = 1200 + (Math.random() * 800); // 1.2-2.0s
    const ttfb = 400 + (Math.random() * 400); // 400-800ms

    return {
      lcp: Math.round(lcp),
      fid: Math.round(fid),
      cls: Math.round(cls * 1000) / 1000,
      fcp: Math.round(fcp),
      ttfb: Math.round(ttfb)
    };
  } catch (error) {
    console.error('Failed to collect Web Vitals metrics:', error);
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0
    };
  }
}