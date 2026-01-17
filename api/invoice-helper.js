import ejs from 'ejs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getBrowserPool } from './browser-pool.js';
import { getRedisCache } from './redis-cache.js';

/**
 * Package details mapping (for display names and descriptions only)
 * Prices are NOT used - actual amount paid is used from payment data
 */
const PACKAGE_DETAILS = {
  namecheck: {
    name: 'Name Check',
    description: 'Quick Name Compatibility Check | Mulank & Bhagyank Overview',
  },
  single: {
    name: 'Name Correction Blueprint',
    description: 'Complete Numerological Analysis | PDF Report (50+ Pages) | 2-3 Corrected Name Options',
  },
  family: {
    name: 'Family Package (3 Reports)',
    description: '3 Complete Name Analysis Reports | 150+ Pages Total | Buy 2 Get 1 FREE',
  },
};

/**
 * Get package details for invoice
 */
export function getPackageDetails(packageType) {
  return PACKAGE_DETAILS[packageType] || PACKAGE_DETAILS.single;
}

// In-memory cache fallback (if Redis unavailable)
let cachedStaticData = null;
let cachedTemplateContent = null;
let cachedTemplatePath = null;
let cachedDataPath = null;
// Pre-compiled EJS template function for faster rendering
let compiledTemplate = null;

/**
 * Get cached static data (company info, bank details, etc.)
 * Uses Redis cache if available, falls back to in-memory cache
 */
async function getStaticData() {
  // Try Redis first (non-blocking)
  try {
    const cache = getRedisCache();
    await cache.initialize();
    
    if (cache.isConnected && cache.client) {
      const cached = await cache.get('invoice:static-data');
      if (cached) {
        return cached;
      }
    }
  } catch (redisError) {
    // Redis failed, continue with file-based fallback
    // Error already logged in redis-cache.js
  }
  
  // Fallback to in-memory cache (always works)
  if (!cachedStaticData || !cachedDataPath) {
    const rootDir = process.cwd();
    cachedDataPath = join(rootDir, 'templates', 'invoice-data.json');
    cachedStaticData = JSON.parse(readFileSync(cachedDataPath, 'utf-8'));
    
    // Try to cache in Redis if available (non-blocking)
    try {
      const cache = getRedisCache();
      if (cache.isConnected && cache.client) {
        await cache.set('invoice:static-data', cachedStaticData, 86400); // 24 hours
      }
    } catch (redisError) {
      // Ignore Redis caching errors
    }
  }
  
  return cachedStaticData;
}

/**
 * Get cached template content
 * Uses Redis cache if available, falls back to in-memory cache
 */
async function getTemplateContent() {
  // Try Redis first (non-blocking)
  try {
    const cache = getRedisCache();
    await cache.initialize();
    
    if (cache.isConnected && cache.client) {
      const cached = await cache.get('invoice:template-content');
      if (cached) {
        return cached;
      }
    }
  } catch (redisError) {
    // Redis failed, continue with file-based fallback
    // Error already logged in redis-cache.js
  }
  
  // Fallback to in-memory cache (always works)
  if (!cachedTemplateContent || !cachedTemplatePath) {
    const rootDir = process.cwd();
    cachedTemplatePath = join(rootDir, 'templates', 'invoice.ejs');
    cachedTemplateContent = readFileSync(cachedTemplatePath, 'utf-8');
    
    // Pre-compile template for faster rendering
    compiledTemplate = ejs.compile(cachedTemplateContent, {
      filename: cachedTemplatePath,
      cache: true, // Enable caching of compiled functions
    });
    
    // Try to cache in Redis if available (non-blocking)
    try {
      const cache = getRedisCache();
      if (cache.isConnected && cache.client) {
        await cache.set('invoice:template-content', cachedTemplateContent, 86400); // 24 hours
      }
    } catch (redisError) {
      // Ignore Redis caching errors
    }
  }
  
  return cachedTemplateContent;
}

/**
 * Generate invoice PDF using browser pool (recommended for production)
 */
export async function generateInvoicePDFWithPool({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  amount, // Amount in rupees (actual amount paid)
  packageType,
  transactionId,
  invoiceDate,
  dueDate,
}) {
  try {
    // Generate unique invoice ID
    const invoiceId = "INV-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    // Load cached static data (company info, bank details, terms)
    // All payment/customer data comes from real payment flow
    const staticData = await getStaticData();
    
    // Get package details for display name and description
    const packageDetails = getPackageDetails(packageType);
    
    // Create invoice items using REAL payment data
    // Use actual amount paid, not package price
    const items = [{
      name: packageDetails.name,
      description: packageDetails.description,
      quantity: 1,
      unitPrice: amount, // Real amount paid
      total: amount, // Real amount paid
    }];

    // Calculate totals using REAL payment data
    const subtotal = amount; // Actual amount paid
    const tax = 0;
    const discount = 0;
    const total = amount; // Actual amount paid

    // Format dates - use provided dates or current date
    const formatDate = (date) => {
      if (date) return date;
      const now = new Date();
      return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Build invoice data using REAL payment data
    const invoiceData = {
      // Static data from JSON (company info, bank details)
      company: staticData.company,
      bankDetails: staticData.bankDetails,
      upiDetails: staticData.upiDetails,
      terms: staticData.terms,
      
      // REAL data from payment flow
      invoiceNumber: invoiceId, // Unique invoice ID (not orderId)
      invoiceDate: formatDate(invoiceDate), // Real or current date
      dueDate: formatDate(dueDate), // Real or current date
      customer: {
        name: customerName, // Real customer name
        email: customerEmail, // Real customer email
        phone: customerPhone || '', // Real customer phone
        address: customerAddress || '', // Real customer address if available
      },
      items, // Real items with actual amount paid
      subtotal, // Real subtotal
      tax, // Real tax (if any)
      discount, // Real discount (if any)
      total, // Real total amount paid
      notes: [
        ...(staticData.notes || []),
        `Package Type: ${packageDetails.name}`, // Real package type
        `Order ID: ${orderId}`, // Include order ID in notes
        ...(transactionId ? [`Transaction ID: ${transactionId}`] : []), // Real transaction ID
      ],
    };

    // Get cached template content
    const templateContent = await getTemplateContent();
    const templatePath = cachedTemplatePath || join(process.cwd(), 'templates', 'invoice.ejs');

    // Render HTML using pre-compiled template if available (faster)
    let html;
    if (compiledTemplate) {
      html = compiledTemplate(invoiceData);
    } else {
      // Fallback to regular render if compilation failed
      html = ejs.render(templateContent, invoiceData, {
        filename: templatePath,
        cache: true, // Enable caching
      });
    }

    // Generate PDF using browser pool with aggressive timeouts
    console.log(`🔄 Starting PDF generation for invoice ${invoiceId}...`);
    const browserPool = getBrowserPool();
    
    // Initialize browser pool with timeout (10 seconds)
    const initPromise = browserPool.initialize();
    const initTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Browser pool initialization timeout after 10 seconds')), 10000)
    );
    
    try {
      await Promise.race([initPromise, initTimeout]);
      console.log(`✅ Browser pool initialized, generating PDF...`);
    } catch (initError) {
      console.error(`❌ Browser pool initialization failed:`, initError.message);
      throw new Error(`Failed to initialize browser pool: ${initError.message}`);
    }
    
    // Generate PDF with timeout (25 seconds total)
    const pdfGenerationPromise = browserPool.generatePDF(html);
    const pdfTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF generation timeout after 25 seconds')), 25000)
    );
    
    const pdfBuffer = await Promise.race([pdfGenerationPromise, pdfTimeout]);
    console.log(`✅ PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Return both PDF buffer and invoice ID
    return {
      pdfBuffer,
      invoiceId,
    };

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error.message}`);
  }
}

/**
 * Generate invoice PDF (legacy method - uses browser pool internally)
 * Kept for backward compatibility
 */
export async function generateInvoicePDF(params) {
  return generateInvoicePDFWithPool(params);
}
