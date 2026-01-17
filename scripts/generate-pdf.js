import ejs from 'ejs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function generatePDF() {
  try {
    console.log('📄 Generating PDF from EJS template...');

    // Load template and data
    const templatePath = join(rootDir, 'templates', 'invoice.ejs');
    const dataPath = join(rootDir, 'templates', 'invoice-data.json');

    const templateContent = readFileSync(templatePath, 'utf-8');
    const staticData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    // Generate sample invoice ID
    const invoiceId = "INV-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
    const orderId = "ORD" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    // Format dates
    const now = new Date();
    const invoiceDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Create sample invoice data for testing/preview
    // Note: In production, invoice data comes from actual payment flow
    const invoiceData = {
      company: staticData.company,
      invoiceNumber: invoiceId,
      invoiceDate: invoiceDate,
      dueDate: invoiceDate,
      customer: {
        name: 'Sample Customer',
        email: 'sample@example.com',
        phone: '+91-0000000000',
        address: '',
      },
      items: [
        {
          name: 'Name Correction Blueprint',
          description: 'Complete Numerological Analysis | PDF Report (50+ Pages) | 2-3 Corrected Name Options',
          quantity: 1,
          unitPrice: 1997.00,
          total: 1997.00,
        },
      ],
      subtotal: 1997.00,
      tax: 0.00,
      discount: 0.00,
      total: 1997.00,
      bankDetails: staticData.bankDetails,
      upiDetails: staticData.upiDetails,
      notes: [
        ...(staticData.notes || []),
        'Package Type: Name Correction Blueprint',
        `Order ID: ${orderId}`,
      ],
      terms: staticData.terms,
    };

    // Render EJS template to HTML
    const html = ejs.render(templateContent, invoiceData, {
      filename: templatePath,
    });

    // Launch Puppeteer
    console.log('🖨️  Converting to PDF...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF with minimal margins to fit on one page
    const pdfPath = join(rootDir, 'templates', 'invoice-sample.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: '10px',
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log('✅ PDF generated successfully!');
    console.log('📁 PDF saved to:', pdfPath);
    console.log('\nOpen the PDF file to preview the invoice.');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

generatePDF();
