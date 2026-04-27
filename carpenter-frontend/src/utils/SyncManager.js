import { orderService } from '../services/orderService';

class SyncManager {
  constructor() {
    this.queue = this.loadQueue();
    this.isProcessing = false;
    this.retryIntervals = [2000, 5000, 15000, 30000, 60000]; // Exponential backoff
    
    // Start background processor
    window.addEventListener('online', () => this.processQueue());
    setInterval(() => this.processQueue(), 30000); // Heartbeat every 30s
  }

  loadQueue() {
    const saved = localStorage.getItem('sync_queue');
    return saved ? JSON.parse(saved) : [];
  }

  saveQueue() {
    localStorage.setItem('sync_queue', JSON.stringify(this.queue));
  }

  /**
   * Adds a new sync task. If a task for the same key exists, 
   * only keeps the one with the HIGHER version.
   */
  addTask(key, payload, version, type = 'DRAFT') {
    // Optimization: If we have multiple draft updates in queue, only the latest version matters
    this.queue = this.queue.filter(task => !(task.key === key && task.version < version));
    
    // Don't add if a newer version is already in queue
    if (this.queue.some(task => task.key === key && task.version >= version)) return;

    this.queue.push({
      id: crypto.randomUUID(),
      key,
      payload,
      version,
      type,
      attempts: 0,
      nextRetry: Date.now()
    });
    this.saveQueue();
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;
    this.isProcessing = true;

    for (const task of [...this.queue]) {
      if (task.nextRetry > Date.now()) continue;

      try {
        if (task.type === 'DRAFT') {
          await orderService.saveDraft({ content: task.payload, version: task.version });
        } else if (task.type === 'SUBMISSION') {
           // Submissions are special, handled separately to ensure X-Idempotency-Key
           continue; 
        }

        // Success: Remove from queue
        this.queue = this.queue.filter(t => t.id !== task.id);
        this.saveQueue();
      } catch (error) {
        if (error.response?.status === 409) {
          // Version Conflict: Server is newer. Remove task and trigger refresh in UI.
          this.queue = this.queue.filter(t => t.id !== task.id);
          window.dispatchEvent(new CustomEvent('sync-conflict', { detail: { key: task.key } }));
        } else if (error.response?.status === 401 || error.response?.status === 403) {
           // Auth error: Stop retrying until login
           this.isProcessing = false;
           return;
        } else {
          // Network error: Backoff
          task.attempts++;
          if (task.attempts >= this.retryIntervals.length) {
            // Stop retrying after 5 attempts
            // task.nextRetry = Infinity; 
            task.nextRetry = Date.now() + 3600000; // Try again in 1 hour
          } else {
            task.nextRetry = Date.now() + this.retryIntervals[task.attempts];
          }
        }
      }
    }

    this.saveQueue();
    this.isProcessing = false;
  }
}

export const syncManager = new SyncManager();
