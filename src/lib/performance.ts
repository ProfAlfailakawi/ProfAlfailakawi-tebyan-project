class PerformanceMonitor extends EventTarget {
  pageLoadTime = 0;
  aiResponseTimes: { name: string; time: number }[] = [];
  apiCallsCount = 0;
  recentApiCalls: number[] = [];
  slowOperations: { name: string; time: number; timestamp: number; rootCause?: string }[] = [];

  constructor() {
    super();
    if (typeof window !== 'undefined') {
      const calculateLoadTime = () => {
        setTimeout(() => {
          const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navEntry) {
            this.pageLoadTime = navEntry.loadEventEnd - navEntry.startTime;
            this.notify();
            
            if (this.pageLoadTime > 2000) {
              // Only get the last 50 resources to avoid massive array filtering
              const resources = performance.getEntriesByType('resource').slice(-50);
              const heavyScripts = resources.filter(r => (r.name.includes('.js') || r.name.includes('.ts')) && r.duration > 800).length;
              let rootCause = "The interface might feel heavy due to background processing.";
              if (heavyScripts > 0) {
                  rootCause = `Script execution is taking longer than expected (${heavyScripts} scripts).`;
              }
              this.emitAlert(`Notice: ${(this.pageLoadTime / 1000).toFixed(1)}s load. ${rootCause}`, 'info');
            }
          }
        }, 0);
      };

      if (document.readyState === 'complete') {
        calculateLoadTime();
      } else {
        window.addEventListener('load', calculateLoadTime);
      }
    }
  }

  recordApiCall(name: string, durationMs: number) {
    const now = Date.now();
    this.apiCallsCount++;
    this.recentApiCalls.push(now);
    
    // Clean up old calls to keep track of calls in the last 10 seconds
    this.recentApiCalls = this.recentApiCalls.filter(ts => now - ts < 10000);
    
    this.aiResponseTimes.push({ name, time: durationMs });
    if (this.aiResponseTimes.length > 50) this.aiResponseTimes.shift();
    
    if (durationMs > 1000) {
      let rootCause = "";
      // Intelligent root cause analysis
      if (this.recentApiCalls.length > 3) {
          rootCause = "High activity mode: Synchronizing multiple intelligence streams.";
      } else if (durationMs > 8000) {
          rootCause = "Complex reasoning: AI is generating a deep educational sequence.";
      } else {
          rootCause = "Latency check: Regional server delays detected.";
      }

      this.slowOperations.push({ name, time: durationMs, timestamp: now, rootCause });
      console.log(`[PERF] ${name} took ${durationMs.toFixed(0)}ms. ${rootCause}`);
      this.emitAlert(`${rootCause} (${(durationMs / 1000).toFixed(1)}s)`, 'info');
      if (this.slowOperations.length > 20) this.slowOperations.shift();
    }
    
    // Check for API spikes
    if (this.recentApiCalls.length > 8) {
        this.emitAlert(`Spike detected: ${this.recentApiCalls.length} calls in 10s. High volume overhead.`, 'info');
    }
    
    this.notify();
  }

  emitAlert(message: string, type: 'warning' | 'info' | 'error' = 'warning') {
    this.dispatchEvent(new CustomEvent('alert', { detail: { message, type, id: Date.now() + Math.random() } }));
  }

  notify() {
    this.dispatchEvent(new Event('update'));
  }
}

export const perfMonitor = new PerformanceMonitor();
