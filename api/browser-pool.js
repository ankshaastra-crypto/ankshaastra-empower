import { Cluster } from 'puppeteer-cluster';

/**
 * Get Chromium executable path for serverless environments (Vercel, AWS Lambda, etc.)
 */
async function getChromiumExecutablePath() {
  // Check if we're in a serverless environment
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;
  
  if (isServerless) {
    try {
      console.log('🔍 Attempting to load @sparticuz/chromium for serverless environment...');
      console.log('Environment check:', {
        VERCEL: !!process.env.VERCEL,
        AWS_LAMBDA: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
        LAMBDA_ROOT: !!process.env.LAMBDA_TASK_ROOT,
      });
      
      // Use @sparticuz/chromium for serverless environments
      // Try both default and named exports
      let chromium;
      try {
        const chromiumModule = await import('@sparticuz/chromium');
        chromium = chromiumModule.default || chromiumModule;
      } catch (importError) {
        console.error('❌ Failed to import @sparticuz/chromium:', importError.message);
        return undefined;
      }
      
      if (!chromium) {
        console.error('❌ @sparticuz/chromium module is null or undefined');
        return undefined;
      }
      
      console.log('✅ @sparticuz/chromium module loaded');
      
      // Configure chromium for serverless
      if (chromium.setGraphicsMode && typeof chromium.setGraphicsMode === 'function') {
        chromium.setGraphicsMode(false);
      }
      
      // Get executable path - @sparticuz/chromium handles extraction automatically
      // executablePath() is synchronous and extracts Chromium to /tmp if needed
      let executablePath;
      if (typeof chromium.executablePath === 'function') {
        try {
          executablePath = chromium.executablePath();
        } catch (execPathError) {
          console.error('❌ Error calling chromium.executablePath():', execPathError.message);
          return undefined;
        }
      } else if (chromium.default && typeof chromium.default.executablePath === 'function') {
        try {
          executablePath = chromium.default.executablePath();
        } catch (execPathError) {
          console.error('❌ Error calling chromium.default.executablePath():', execPathError.message);
          return undefined;
        }
      } else {
        console.error('❌ chromium.executablePath is not a function. Available methods:', Object.keys(chromium));
        return undefined;
      }
      
      if (executablePath) {
        console.log('✅ @sparticuz/chromium executable path:', executablePath);
        return executablePath;
      } else {
        console.warn('⚠️ @sparticuz/chromium executablePath returned undefined or empty');
        return undefined;
      }
    } catch (error) {
      console.error('❌ Failed to load @sparticuz/chromium:', error.message);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
      // Don't throw - let it fall back to default Puppeteer
      return undefined;
    }
  }
  
  // Local development - use default Puppeteer browser
  console.log('📦 Using default Puppeteer browser (local development)');
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
        console.log('📦 Configured Puppeteer with serverless Chromium:', executablePath);
      } else {
        console.log('📦 Using default Puppeteer browser (executablePath not set)');
      }

      console.log('🚀 Launching browser cluster with options:', {
        executablePath: executablePath ? 'Set' : 'Default',
        maxConcurrency: process.env.VERCEL ? 2 : 5,
        argsCount: args.length,
      });

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
      // Don't throw - let generatePDF handle fallback
      this.isInitialized = false;
      this.cluster = null;
      return null;
    }
  }

  /**
   * Generate PDF using browser pool (with fallback to direct Puppeteer)
   * @param {string} html - HTML content to convert to PDF
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(html) {
    // Try browser pool first
    try {
      if (!this.isInitialized || !this.cluster) {
        const initResult = await this.initialize();
        if (!initResult || !this.cluster) {
          throw new Error('Browser pool initialization failed');
        }
      }

      const pdfBuffer = await this.cluster.execute(async ({ page }) => {
        // Set timeout for page operations
        page.setDefaultTimeout(15000); // Reduced from 30s
        
        // Use 'load' instead of 'networkidle0' for much faster rendering
        // 'load' waits for page load, 'networkidle0' waits for ALL network activity (much slower)
        await page.setContent(html, {
          waitUntil: 'load', // Changed from 'networkidle0' - 50-70% faster
          timeout: 15000, // Reduced from 30s
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
            displayHeaderFooter: false, // Disable header/footer for faster generation
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF generation timeout')), 20000) // Reduced from 30s
          ),
        ]);

        return buffer;
      });

      return pdfBuffer;
    } catch (clusterError) {
      console.error('❌ Browser pool failed, trying direct Puppeteer fallback:', clusterError.message);
      console.error('Cluster error details:', {
        message: clusterError.message,
        stack: clusterError.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      // Fallback to direct Puppeteer launch
      return this.generatePDFDirect(html, clusterError);
    }
  }

  /**
   * Generate PDF using direct Puppeteer (fallback method)
   * @param {string} html - HTML content to convert to PDF
   * @param {Error} originalError - Original error from cluster attempt
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDFDirect(html, originalError = null) {
    try {
      const puppeteer = await import('puppeteer');
      const executablePath = await getChromiumExecutablePath();
      const args = getChromiumArgs();
      
      const launchOptions = {
        headless: true,
        args,
        timeout: 60000, // Increased timeout for serverless
      };
      
      if (executablePath) {
        launchOptions.executablePath = executablePath;
        console.log('📦 Using direct Puppeteer with serverless Chromium:', executablePath);
      } else {
        console.log('📦 Using direct Puppeteer with default browser');
      }
      
      console.log('🚀 Launching direct Puppeteer browser...');
      const browser = await Promise.race([
        puppeteer.launch(launchOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Browser launch timeout after 15 seconds')), 15000)
        )
      ]);
      
      try {
        const page = await Promise.race([
          browser.newPage(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Page creation timeout')), 5000)
          )
        ]);
        
        page.setDefaultTimeout(20000); // Reduced timeout
        
        console.log('📄 Setting page content...');
        await Promise.race([
          page.setContent(html, {
            waitUntil: 'load', // Changed from 'networkidle0' - much faster
            timeout: 15000, // Reduced from 20s
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Page content timeout after 15 seconds')), 15000)
          )
        ]);
        
        console.log('📄 Generating PDF...');
        const pdfBuffer = await Promise.race([
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
            displayHeaderFooter: false, // Disable header/footer for faster generation
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF generation timeout after 15 seconds')), 15000) // Reduced from 20s
          ),
        ]);
        
        await browser.close();
        console.log('✅ PDF generated using direct Puppeteer fallback');
        return pdfBuffer;
      } catch (pdfError) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError.message);
        }
        throw pdfError;
      }
    } catch (fallbackError) {
      console.error('❌ Direct Puppeteer fallback also failed:', fallbackError.message);
      console.error('Fallback error details:', {
        message: fallbackError.message,
        stack: fallbackError.stack?.split('\n').slice(0, 5).join('\n')
      });
      
      const errorMessage = originalError 
        ? `PDF generation failed: Cluster error - ${originalError.message}. Direct Puppeteer error - ${fallbackError.message}`
        : `PDF generation failed: ${fallbackError.message}`;
      
      throw new Error(errorMessage);
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
