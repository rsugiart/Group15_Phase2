

// Import necessary modules from Node.js
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

// Task type definition
type Task = () => Promise<any>;

// ThreadPool class manages a pool of workers to handle concurrent tasks
class ThreadPool {
  private workers: Worker[] = [];
  private taskQueue: Task[] = [];
  private activeTasks: number = 0;

  constructor(private poolSize: number) {
    this.initializeWorkers();
  }

  // Initialize workers based on the pool size
  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      this.createWorker();
    }
  }

  // Create a new worker and manage its lifecycle
  private createWorker() {
    const worker = new Worker(__filename);

    worker.on('message', () => {
      this.activeTasks--;
      this.executeNextTask();
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
      this.activeTasks--;
      this.executeNextTask();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        this.createWorker(); // Replace the worker if it exits unexpectedly
      }
    });

    this.workers.push(worker);
  }

  // Execute the next task from the queue if a worker is available
  private executeNextTask() {
    if (this.taskQueue.length === 0 || this.activeTasks >= this.poolSize) return;

    const task = this.taskQueue.shift();
    if (task) {
      this.activeTasks++;
      const worker = this.workers.pop();
      if (worker) {
        worker.postMessage({ task: task.toString() }); // Send the task as a stringified function to the worker
        this.workers.push(worker); // Return the worker back to the pool
      }
    }
  }

  // Submit a new task to the thread pool
  public submitTask(task: Task) {
    this.taskQueue.push(task);
    this.executeNextTask();
  }

  // Gracefully close all workers in the thread pool
  public close() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}

// Worker code to handle tasks
if (!isMainThread) {
  parentPort?.on('message', async ({ task }: { task: string }) => {
    const taskFunc: Task = eval(`(${task})`); // Convert the string back to a function
    try {
      await taskFunc(); // Execute the task
      parentPort?.postMessage('done');
    } catch (error) {
      parentPort?.postMessage('error');
    }
  });
}

// Main thread code
if (isMainThread) {
  const poolSize = 4; // Number of concurrent workers
  const threadPool = new ThreadPool(poolSize);

  // Example tasks
  const tasks: Task[] = [
    () => new Promise((resolve) => setTimeout(() => resolve(console.log('Task 1 done')), 1000)),
    () => new Promise((resolve) => setTimeout(() => resolve(console.log('Task 2 done')), 500)),
    () => new Promise((resolve) => setTimeout(() => resolve(console.log('Task 3 done')), 1500)),
    () => new Promise((resolve) => setTimeout(() => resolve(console.log('Task 4 done')), 700)),
  ];

  // Submit tasks to the thread pool
  for (const task of tasks) {
    threadPool.submitTask(task);
  }

  // Allow some time for all tasks to complete before closing the pool
  setTimeout(() => {
    threadPool.close();
    console.log('All tasks completed and pool closed.');
  }, 3000);
}
