// ============= Performance Metrics Utility =============

import { PerformanceMetrics, PerformanceThresholds } from '@/types/editing';

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  keystrokeToDisplay: 100, // 100ms target
  keystrokeToPersisted: 500, // 500ms target
  warningMultiplier: 1.5,
};

interface MetricEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMetricsTracker {
  private metrics: Map<string, MetricEntry[]> = new Map();
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private isEnabled: boolean = process.env.NODE_ENV === 'development';
  private maxEntriesPerMetric: number = 100;

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  // Start timing a metric
  startTiming(name: string, elementId?: string): string {
    if (!this.isEnabled) return '';

    const id = `${name}_${elementId || 'global'}_${Date.now()}`;
    const entry: MetricEntry = {
      name,
      startTime: performance.now(),
    };

    const entries = this.metrics.get(name) || [];
    entries.push(entry);
    
    // Keep only recent entries
    if (entries.length > this.maxEntriesPerMetric) {
      entries.shift();
    }
    
    this.metrics.set(name, entries);
    
    console.log(`[Perf] Started: ${name}`);
    return id;
  }

  // End timing a metric
  endTiming(name: string): number {
    if (!this.isEnabled) return 0;

    const entries = this.metrics.get(name);
    if (!entries || entries.length === 0) return 0;

    const entry = entries[entries.length - 1];
    if (!entry || entry.endTime) return 0;

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    console.log(`[Perf] Ended: ${name} - ${entry.duration.toFixed(2)}ms`);

    // Check against thresholds
    this.checkThreshold(name, entry.duration);

    return entry.duration;
  }

  // Measure a sync operation
  measure<T>(name: string, fn: () => T): T {
    this.startTiming(name);
    const result = fn();
    this.endTiming(name);
    return result;
  }

  // Measure an async operation
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(name);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Check if a metric exceeds thresholds
  private checkThreshold(name: string, duration: number) {
    let threshold: number | undefined;

    if (name.includes('keystroke') && name.includes('display')) {
      threshold = this.thresholds.keystrokeToDisplay;
    } else if (name.includes('keystroke') && name.includes('persist')) {
      threshold = this.thresholds.keystrokeToPersisted;
    }

    if (threshold) {
      if (duration > threshold * this.thresholds.warningMultiplier) {
        console.warn(`[Perf Warning] ${name} exceeded threshold: ${duration.toFixed(2)}ms > ${threshold}ms`);
      } else if (duration > threshold) {
        console.log(`[Perf Alert] ${name} approaching threshold: ${duration.toFixed(2)}ms / ${threshold}ms`);
      }
    }
  }

  // Get average duration for a metric
  getAverageDuration(name: string): number {
    const entries = this.metrics.get(name);
    if (!entries || entries.length === 0) return 0;

    const completedEntries = entries.filter(e => e.duration !== undefined);
    if (completedEntries.length === 0) return 0;

    const sum = completedEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
    return sum / completedEntries.length;
  }

  // Get all metrics summary
  getSummary(): Record<string, { average: number; min: number; max: number; count: number }> {
    const summary: Record<string, { average: number; min: number; max: number; count: number }> = {};

    this.metrics.forEach((entries, name) => {
      const completedEntries = entries.filter(e => e.duration !== undefined);
      if (completedEntries.length === 0) return;

      const durations = completedEntries.map(e => e.duration || 0);
      summary[name] = {
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    });

    return summary;
  }

  // Create a full metrics report
  createReport(elementId: string): PerformanceMetrics {
    return {
      keystrokeToStateMs: this.getAverageDuration('keystroke_to_state'),
      stateToRenderMs: this.getAverageDuration('state_to_render'),
      renderToDisplayMs: this.getAverageDuration('render_to_display'),
      saveToDbMs: this.getAverageDuration('save_to_db'),
      totalLatencyMs: this.getAverageDuration('total_latency'),
      timestamp: Date.now(),
      elementId,
    };
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }

  // Export metrics for analysis
  export(): string {
    const data = {
      summary: this.getSummary(),
      thresholds: this.thresholds,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const performanceMetrics = new PerformanceMetricsTracker();

// Convenience functions
export const startTiming = (name: string, elementId?: string) => 
  performanceMetrics.startTiming(name, elementId);

export const endTiming = (name: string) => 
  performanceMetrics.endTiming(name);

export const measure = <T>(name: string, fn: () => T) => 
  performanceMetrics.measure(name, fn);

export const measureAsync = <T>(name: string, fn: () => Promise<T>) => 
  performanceMetrics.measureAsync(name, fn);
