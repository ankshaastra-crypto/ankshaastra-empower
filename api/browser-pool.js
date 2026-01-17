import { Cluster } from 'puppeteer-cluster';

/**
 * Get Chromium executable path for serverless environments (Vercel, AWS Lambda, etc.)
 */
async function getChromiumExecutablePath() {
  // Check if we're in a serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    try {
      // Use @sparticuz/chromium for serverless environments
      const chromium = await import('@sparticuz/chromium');
      // Set font path for better PDF rendering
      chromium.setGraphicsMode(false);
      return chromium.executablePath();
    } catch (error) {
      console.warn('⚠️ @sparticuz/chromium not available, using default Puppeteer browser:', error.message);
      return undefined; // Fall back to default Puppeteer browser
    }
  }
  // Local development - use default Puppeteer browser
  return undefined;
}

/**
 * Get Chromium args for serverless environments
 */
function getChromiumArgs() {
  const baseArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
  ];

  // Add serverless-specific args
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    baseArgs.push(
      '--single-process',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--no-pings',
      '--no-zygote',
      '--use-gl=swiftshader',
      '--window-size=1920,1080'
    );
  }

  return baseArgs;
}

/**
 * Browser Pool Manager using puppeteer-cluster
 * Manages a pool of browser instances for efficient PDF generation
 */
class BrowserPool {
  constructor() {
    this.cluster = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the browser cluster
   */
  async initialize() {
    if (this.isInitialized && this.cluster) {
      return this.cluster;
    }

    try {
      const executablePath = await getChromiumExecutablePath();
      const args = getChromiumArgs();

      const puppeteerOptions = {
        headless: true,
        args,
        timeout: 30000,
      };

      // Set executable path if available (for serverless)
      if (executablePath) {
        puppeteerOptions.executablePath = executablePath;
        console.log('📦 Using serverless Chromium:', executablePath);
      }

      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE, // One task per page
        maxConcurrency: process.env.VERCEL ? 2 : 5, // Lower concurrency on Vercel
        puppeteerOptions,
        timeout: 30000,
      });

      this.isInitialized = true;
      console.log('✅ Browser pool initialized successfully');
      return this.cluster;
    } catch (error) {
      console.error('❌ Failed to initialize browser pool:', error);
      throw error;
    }
  }

  /**
   * Generate PDF using browser pool
   * @param {string} html - HTML content to convert to PDF
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(html) {
    if (!this.isInitialized || !this.cluster) {
      await this.initialize();
    }

    try {
      const pdfBuffer = await this.cluster.execute(async ({ page }) => {
        // Set timeout for page operations
        page.setDefaultTimeout(30000);
        
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });

        const buffer = await Promise.race([
          page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '10px',
              right: '10px',
              bottom: '10px',
              left: '10px',
            },
            preferCSSPageSize: false,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
          ),
        ]);

        return buffer;
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF with browser pool:', error);
      throw error;
    }
  }

  /**
   * Close the browser cluster
   */
  async close() {
    if (this.cluster) {
      try {
        await this.cluster.idle();
        await this.cluster.close();
        this.cluster = null;
        this.isInitialized = false;
        console.log('✅ Browser pool closed successfully');
      } catch (error) {
        console.error('Error closing browser pool:', error);
      }
    }
  }

  /**
   * Get cluster status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      queueSize: this.cluster?.queueSize || 0,
    };
  }
}

// Singleton instance
let browserPoolInstance = null;

/**
 * Get browser pool instance (singleton)
 */
export function getBrowserPool() {
  if (!browserPoolInstance) {
    browserPoolInstance = new BrowserPool();
  }
  return browserPoolInstance;
}

/**
 * Initialize browser pool (call this on server startup)
 */
export async function initializeBrowserPool() {
  const pool = getBrowserPool();
  await pool.initialize();
  return pool;
}

/**
 * Close browser pool (call this on server shutdown)
 */
export async function closeBrowserPool() {
  if (browserPoolInstance) {
    await browserPoolInstance.close();
    browserPoolInstance = null;
  }
}
