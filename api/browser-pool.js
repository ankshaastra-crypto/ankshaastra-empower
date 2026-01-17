import { Cluster } from 'puppeteer-cluster';

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
      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE, // One task per page
        maxConcurrency: 5, // Maximum 5 concurrent PDF generations
        puppeteerOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
          timeout: 30000,
        },
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
