import { Queue, Worker } from 'bullmq';
import { generateInvoicePDFWithPool } from './invoice-helper.js';
import { sendPaymentEmail } from './send-email.js';
import Redis from 'ioredis';

/**
 * Invoice Generation Queue
 * Handles async invoice generation using BullMQ
 */

// Initialize Redis connection for queue
let redisConnection = null;

async function getRedisConnection() {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });
    
    // Handle connection errors gracefully
    redisConnection.on('error', (err) => {
      // Only log if Redis URL is explicitly set
      if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
        console.error('❌ Invoice queue Redis error:', err.message);
      }
    });
    
    redisConnection.on('connect', () => {
      if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
        console.log('✅ Invoice queue Redis connected');
      }
    });
  }
  return redisConnection;
}

// Create invoice generation queue
let invoiceQueue = null;

export async function getInvoiceQueue() {
  if (!invoiceQueue) {
    const connection = await getRedisConnection();
    invoiceQueue = new Queue('invoice-generation', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });
  }
  return invoiceQueue;
}

// Create worker to process invoice generation jobs
let invoiceWorker = null;

export async function startInvoiceWorker() {
  if (invoiceWorker) {
    return invoiceWorker;
  }

  const connection = await getRedisConnection();
  
  invoiceWorker = new Worker(
    'invoice-generation',
    async (job) => {
      const {
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        amount,
        packageType,
        transactionId,
        invoiceDate,
        dueDate,
        emailData, // Additional email data
      } = job.data;

      console.log(`📄 Processing invoice generation for order: ${orderId}`);

      try {
        // Generate invoice PDF using browser pool
        const invoiceResult = await generateInvoicePDFWithPool({
          orderId,
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          amount,
          packageType,
          transactionId,
          invoiceDate,
          dueDate,
        });

      // Send email with invoice attachment
      if (emailData) {
        const emailResult = await sendPaymentEmail({
          ...emailData,
          _invoicePDFBuffer: invoiceResult.pdfBuffer,
          _invoiceId: invoiceResult.invoiceId,
        });

        return {
          success: true,
          invoiceId: invoiceResult.invoiceId,
          emailSent: emailResult.success,
          messageId: emailResult.customerMessageId,
        };
      }

        return {
          success: true,
          invoiceId: invoiceResult.invoiceId,
          pdfBuffer: invoiceResult.pdfBuffer,
        };
      } catch (error) {
        console.error(`❌ Error processing invoice for order ${orderId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5, // Process 5 invoices concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per second
      },
    }
  );

  invoiceWorker.on('completed', (job) => {
    console.log(`✅ Invoice generated successfully for order: ${job.data.orderId}`);
  });

  invoiceWorker.on('failed', (job, err) => {
    console.error(`❌ Invoice generation failed for order ${job?.data?.orderId}:`, err);
  });

  invoiceWorker.on('error', (err) => {
    console.error('❌ Invoice worker error:', err);
  });

  console.log('✅ Invoice worker started');
  return invoiceWorker;
}

/**
 * Add invoice generation job to queue
 * @param {Object} invoiceData - Invoice generation data
 * @param {Object} emailData - Email sending data (optional)
 * @returns {Promise<Job>} BullMQ job
 */
export async function queueInvoiceGeneration(invoiceData, emailData = null) {
  const queue = await getInvoiceQueue();
  
  const job = await queue.add('generate-invoice', {
    ...invoiceData,
    emailData,
  }, {
    priority: emailData ? 1 : 0, // Higher priority if email needs to be sent
  });

  console.log(`📋 Invoice generation queued for order: ${invoiceData.orderId}, Job ID: ${job.id}`);
  return job;
}

/**
 * Close queue and worker
 */
export async function closeInvoiceQueue() {
  if (invoiceWorker) {
    await invoiceWorker.close();
    invoiceWorker = null;
  }
  
  if (invoiceQueue) {
    await invoiceQueue.close();
    invoiceQueue = null;
  }
  
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
  
  console.log('✅ Invoice queue closed');
}
