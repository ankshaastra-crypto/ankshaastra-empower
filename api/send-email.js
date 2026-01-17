// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js';

import nodemailer from 'nodemailer';
import { generateInvoicePDF } from './invoice-helper.js';
import { queueInvoiceGeneration } from './invoice-queue.js';

/**
 * Helper function to send invoice email when PDF is ready
 * This is called AFTER confirmation email is sent
 */
async function sendInvoiceEmail(invoicePDFBuffer, invoiceId, customerEmail, customerName, orderId, fromEmail) {
  try {
    const transporter = getTransporter();
    const invoiceEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2E1A47 0%, #4A2C6A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Your Invoice</h1>
          </div>
          <div class="content">
            <p>Dear ${customerName || 'Customer'},</p>
            <p>Thank you for your purchase! Please find your invoice attached.</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Invoice ID:</strong> ${invoiceId}</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Ankshaastra Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: fromEmail,
      to: customerEmail,
      subject: `Invoice for Order ${orderId} - ${invoiceId}`,
      html: invoiceEmailHtml,
      attachments: [{
        filename: `${invoiceId}.pdf`,
        content: invoicePDFBuffer,
        contentType: 'application/pdf',
      }],
    });
    
    console.log(`✅ Invoice email sent successfully: ${invoiceId} to ${customerEmail}`);
    return { success: true, invoiceId };
  } catch (emailError) {
    console.error(`❌ Failed to send invoice email for ${invoiceId}:`, emailError.message);
    return { success: false, error: emailError.message };
  }
}

/**
 * Start invoice generation in background AFTER email is sent
 * This ensures email sending is never blocked
 */
async function startInvoiceGenerationInBackground({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  amount,
  packageType,
  transactionId,
  fromEmail,
}) {
  const useQueue = process.env.USE_INVOICE_QUEUE === 'true';
  
  try {
    if (useQueue) {
      // Try queue system first (best for production)
      try {
        const invoiceData = {
          orderId,
          customerName: customerName || 'Customer',
          customerEmail,
          customerPhone,
          customerAddress: customerAddress || '',
          amount,
          packageType: packageType || 'single',
          transactionId: transactionId || '',
          invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        };
        
        // Queue will handle invoice generation and email sending
        await queueInvoiceGeneration(invoiceData, {
          to: customerEmail,
          customerEmail,
          customerName,
          orderId,
          amount: amount * 100, // Convert to paise for email
          packageType,
          status: 'SUCCESS',
          transactionId,
        });
        console.log(`✅ Invoice queued successfully for order: ${orderId}`);
        return;
      } catch (queueError) {
        console.warn(`⚠️ Queue unavailable, using direct generation: ${queueError.message}`);
        // Fall through to direct generation
      }
    }
    
    // Direct invoice generation (fallback when queue unavailable)
    console.log(`📄 Generating invoice PDF for order: ${orderId}`);
    
    const invoiceGenerationPromise = generateInvoicePDF({
      orderId,
      customerName: customerName || 'Customer',
      customerEmail,
      customerPhone,
      customerAddress: customerAddress || '',
      amount,
      packageType: packageType || 'single',
      transactionId: transactionId || '',
      invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    });
    
    // 30 second timeout - if it takes longer, we'll send invoice later
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Invoice generation timeout')), 30000)
    );
    
    const invoiceResult = await Promise.race([invoiceGenerationPromise, timeoutPromise]);
    
    if (invoiceResult && invoiceResult.pdfBuffer && invoiceResult.invoiceId) {
      // Invoice ready! Send it now
      await sendInvoiceEmail(
        invoiceResult.pdfBuffer,
        invoiceResult.invoiceId,
        customerEmail,
        customerName,
        orderId,
        fromEmail
      );
    }
  } catch (invoiceError) {
    console.error(`❌ Background invoice generation failed for order ${orderId}:`, invoiceError.message);
    // Don't worry - customer already got confirmation email
    // Invoice can be regenerated manually if needed
  }
}

// Reuse transporter instance (singleton pattern) for better performance
let transporterInstance = null;

// Create SMTP transporter (singleton)
export const getTransporter = () => {
  if (!transporterInstance) {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
      },
      pool: true, // Use connection pooling
      maxConnections: 5, // Maximum number of connections
      maxMessages: 100, // Maximum messages per connection
      rateDelta: 1000, // Time window for rate limiting (ms)
      rateLimit: 5, // Maximum messages per rateDelta
    };
    
    transporterInstance = nodemailer.createTransport(config);
  }
  
  return transporterInstance;
};

export async function sendPaymentEmail({ 
  to, 
  customerEmail, 
  customerName, 
  customerMobile = '',
  customerDob = '',
  person1Name = '',
  person1Dob = '',
  person2Name = '',
  person2Dob = '',
  person3Name = '',
  person3Dob = '',
  orderId, 
  amount, 
  packageType, 
  status, 
  transactionId,
  _invoicePDFBuffer = null, // Internal: PDF buffer from queue
  _invoiceId = null, // Internal: Invoice ID from queue
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ankshaastra.com';
  const fromEmail = process.env.FROM_EMAIL || 'Ankshaastra <noreply@ankshaastra.com>';
  
  // Normalize values - ensure we have proper fallbacks
  // Use person1Dob first, then fallback to customerDob
  const finalCustomerMobile = (customerMobile && customerMobile.toString().trim()) || '';
  const finalCustomerDob = (customerDob && customerDob.toString().trim()) || '';
  const finalPerson1Name = (person1Name && person1Name.toString().trim()) || (customerName && customerName.toString().trim()) || '';
  const finalPerson1Dob = (person1Dob && person1Dob.toString().trim()) || finalCustomerDob;
  // Normalize person details for family package
  const finalPerson2Name = (person2Name && person2Name.toString().trim()) || '';
  const finalPerson2Dob = (person2Dob && person2Dob.toString().trim()) || '';
  const finalPerson3Name = (person3Name && person3Name.toString().trim()) || '';
  const finalPerson3Dob = (person3Dob && person3Dob.toString().trim()) || '';
  
  // Email configuration logged (customer data removed for privacy)
  
  // Validate required parameters
  if (!customerEmail || !orderId) {
    console.error('❌ Missing required parameters for email');
    return {
      success: false,
      error: 'Missing required parameters: customerEmail and orderId are required.',
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) {
    console.error('❌ Invalid customer email format');
    return {
      success: false,
      error: `Invalid customer email format: ${customerEmail}`,
    };
  }
  
  if (!emailRegex.test(adminEmail)) {
    console.error('❌ Invalid admin email format');
    return {
      success: false,
      error: `Invalid admin email format: ${adminEmail}`,
    };
  }

  // Validate SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ SMTP configuration is missing');
    console.error('Missing variables:', {
      SMTP_HOST: !process.env.SMTP_HOST,
      SMTP_USER: !process.env.SMTP_USER,
      SMTP_PASSWORD: !process.env.SMTP_PASSWORD
    });
    return {
      success: false,
      error: 'SMTP configuration is missing. Please check your environment variables.',
      missing: {
        SMTP_HOST: !process.env.SMTP_HOST,
        SMTP_USER: !process.env.SMTP_USER,
        SMTP_PASSWORD: !process.env.SMTP_PASSWORD
      }
    };
  }

  const packageNames = {
    namecheck: 'Name Check',
    single: 'Single Report',
    family: 'Family Package (3 Reports)'
  };

  const packageName = packageNames[packageType] || packageType;
  // Amount is expected in paise (smallest currency unit), convert to rupees for display
  // Handle edge case where amount might be 0 or undefined
  const amountInRupees = amount && amount > 0 ? amount / 100 : 0;
  const amountFormatted = `₹${amountInRupees.toLocaleString('en-IN')}`;
  
  // Customer email template
  const customerSubject = status === 'SUCCESS' 
    ? `Payment Successful - Order ${orderId}`
    : `Payment Failed - Order ${orderId}`;

  // Check if invoice PDF buffer and ID are provided directly (from queue)
  let invoicePDFBuffer = _invoicePDFBuffer;
  let invoiceId = _invoiceId;
  let invoiceNoteHtml = '';
  let useQueue = process.env.USE_INVOICE_QUEUE === 'true'; // Enable queue via env var
  
  // CRITICAL: Set invoice note FIRST, then email will be sent IMMEDIATELY
  // Invoice generation happens AFTER email is sent (completely non-blocking)
  if (status === 'SUCCESS' && amountInRupees > 0 && !invoicePDFBuffer) {
    // Set note that invoice will be sent separately
    invoiceNoteHtml = '<p style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;"><strong>📄 Invoice Processing:</strong> Your invoice is being generated and will be sent to your email shortly.</p>';
    // DO NOT start invoice generation here - it will block email sending!
    // We'll start it AFTER email is sent using setImmediate
  }

  const customerHtml = status === 'SUCCESS' 
    ? `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2E1A47 0%, #0F0E1A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <div class="success-badge">✓ Payment Confirmed</div>
            <p>Dear ${customerName || 'Valued Customer'},</p>
            <p>Thank you for your purchase! Your payment has been successfully processed.</p>
            ${invoiceNoteHtml}
            
            <div class="details">
              <div class="detail-row">
                <strong>Order ID:</strong>
                <span>${orderId}</span>
              </div>
              <div class="detail-row">
                <strong>Package:</strong>
                <span>${packageName}</span>
              </div>
              <div class="detail-row">
                <strong>Amount Paid:</strong>
                <span>${amountFormatted}</span>
              </div>
              <div class="detail-row">
                <strong>Transaction ID:</strong>
                <span>${transactionId || 'N/A'}</span>
              </div>
            </div>

            <p>Your personalized numerology report will be delivered to this email address within 24-48 hours.</p>
            <p>If you have any questions, please contact us at <a href="tel:9667305577">9667305577</a>.</p>
            
            <div class="footer">
              <p>Thank you for choosing Ankshaastra!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .error-badge { background: #dc2626; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <div class="error-badge">✗ Payment Unsuccessful</div>
            <p>Dear ${customerName || 'Valued Customer'},</p>
            <p>We're sorry, but your payment could not be processed.</p>
            
            <div class="details">
              <div class="detail-row">
                <strong>Order ID:</strong>
                <span>${orderId}</span>
              </div>
              <div class="detail-row">
                <strong>Package:</strong>
                <span>${packageName}</span>
              </div>
              <div class="detail-row">
                <strong>Amount:</strong>
                <span>${amountFormatted}</span>
              </div>
            </div>

            <p>Please try again or contact us at <a href="tel:9667305577">9667305577</a> for assistance.</p>
            
            <div class="footer">
              <p>Thank you for your interest in Ankshaastra!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

  // Admin email template
  const adminSubject = `Payment ${status === 'SUCCESS' ? 'Success' : 'Failed'} - Order ${orderId}`;
  
  // Format DOB for display
  const formatDob = (dob) => {
    if (!dob || dob.trim() === '') return 'N/A';
    try {
      const date = new Date(dob);
      if (isNaN(date.getTime())) return dob; // If invalid date, return as-is
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dob || 'N/A';
    }
  };

  // Helper to check if value exists
  const hasValue = (value) => {
    return value && value.toString().trim() !== '';
  };

  // Build customer details section
  let customerDetailsHtml = '';
  
  if (packageType === 'family') {
    // Family package - ALWAYS show all 3 persons (they are required fields)
    customerDetailsHtml = `
      <div class="person-section">
        <h3 style="color: #2E1A47; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #2E1A47; padding-bottom: 5px;">Person 1 Details:</h3>
        <div class="detail-row">
          <strong>Name:</strong>
          <span>${hasValue(finalPerson1Name) ? finalPerson1Name : 'N/A'}</span>
        </div>
        <div class="detail-row">
          <strong>Date of Birth:</strong>
          <span>${formatDob(finalPerson1Dob)}</span>
        </div>
      </div>
      <div class="person-section">
        <h3 style="color: #2E1A47; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #2E1A47; padding-bottom: 5px;">Person 2 Details:</h3>
        <div class="detail-row">
          <strong>Name:</strong>
          <span>${hasValue(finalPerson2Name) ? finalPerson2Name : 'N/A'}</span>
        </div>
        <div class="detail-row">
          <strong>Date of Birth:</strong>
          <span>${formatDob(finalPerson2Dob)}</span>
        </div>
      </div>
      <div class="person-section">
        <h3 style="color: #2E1A47; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #2E1A47; padding-bottom: 5px;">Person 3 Details:</h3>
        <div class="detail-row">
          <strong>Name:</strong>
          <span>${hasValue(finalPerson3Name) ? finalPerson3Name : 'N/A'}</span>
        </div>
        <div class="detail-row">
          <strong>Date of Birth:</strong>
          <span>${formatDob(finalPerson3Dob)}</span>
        </div>
      </div>
    `;
  } else {
    // Single/Name Check package - show single person
    customerDetailsHtml = `
      <div class="detail-row">
        <strong>Customer Name:</strong>
        <span>${hasValue(finalPerson1Name) ? finalPerson1Name : 'N/A'}</span>
      </div>
      <div class="detail-row">
        <strong>Date of Birth:</strong>
        <span>${formatDob(finalPerson1Dob)}</span>
      </div>
    `;
  }
  
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: ${status === 'SUCCESS' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { background: ${status === 'SUCCESS' ? '#10b981' : '#dc2626'}; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .details { background: white; padding: 25px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-row strong { color: #2E1A47; font-weight: 600; }
        .person-section { margin-top: 15px; padding-top: 15px; border-top: 2px solid #f0f0f0; }
        .contact-info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 15px; }
        .contact-info strong { color: #2E1A47; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Payment ${status === 'SUCCESS' ? 'Success' : 'Failure'}</h1>
        </div>
        <div class="content">
          <div class="status-badge">${status === 'SUCCESS' ? '✓ Payment Confirmed' : '✗ Payment Failed'}</div>
          
          <div class="details">
            <h2 style="color: #2E1A47; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #2E1A47; padding-bottom: 10px;">Order Information</h2>
            <div class="detail-row">
              <strong>Order ID:</strong>
              <span>${orderId}</span>
            </div>
            <div class="detail-row">
              <strong>Package:</strong>
              <span>${packageName}</span>
            </div>
            <div class="detail-row">
              <strong>Amount:</strong>
              <span>${amountFormatted}</span>
            </div>
            <div class="detail-row">
              <strong>Transaction ID:</strong>
              <span>${transactionId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <strong>Status:</strong>
              <span style="color: ${status === 'SUCCESS' ? '#10b981' : '#dc2626'}; font-weight: bold;">${status}</span>
            </div>
          </div>

          <div class="details">
            <h2 style="color: #2E1A47; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #2E1A47; padding-bottom: 10px;">Customer Details</h2>
            ${customerDetailsHtml}
            <div class="contact-info">
              <div class="detail-row">
                <strong>Email ID:</strong>
                <span><a href="mailto:${customerEmail}" style="color: #2E1A47;">${customerEmail}</a></span>
              </div>
              <div class="detail-row">
                <strong>Mobile Number:</strong>
                <span><a href="tel:${hasValue(finalCustomerMobile) ? finalCustomerMobile : ''}" style="color: #2E1A47;">${hasValue(finalCustomerMobile) ? finalCustomerMobile : 'N/A'}</a></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();

    // Verify SMTP connection before sending
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("SMTP verification failed");
      return {
        success: false,
        error: `SMTP connection failed: ${verifyError.message}`,
        details: {
          code: verifyError.code,
          response: verifyError.response,
          responseCode: verifyError.responseCode
        }
      };
    }

    // Send email to customer
    let customerEmailResult = null;
    let customerError = null;
    let customerSuccess = false;
    
    try {
      // Prepare email options
      const customerMailOptions = {
        from: fromEmail,
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
      };

      // Attach invoice PDF if available
      if (invoicePDFBuffer && invoiceId) {
        if (Buffer.isBuffer(invoicePDFBuffer)) {
          customerMailOptions.attachments = [
            {
              filename: `${invoiceId}.pdf`,
              content: invoicePDFBuffer,
              contentType: 'application/pdf',
            },
          ];
          console.log(`✅ Invoice attachment added: ${invoiceId}.pdf (${invoicePDFBuffer.length} bytes)`);
        } else {
          console.error(`❌ Invoice PDF buffer is not a Buffer. Type: ${typeof invoicePDFBuffer}, Is Buffer: ${Buffer.isBuffer(invoicePDFBuffer)}`);
        }
      } else {
        console.warn(`⚠️ Invoice PDF not attached. Has buffer: ${!!invoicePDFBuffer}, Has ID: ${!!invoiceId}`);
      }

      customerEmailResult = await transporter.sendMail(customerMailOptions);
      
      // Validate that we got a valid response
      if (customerEmailResult && customerEmailResult.messageId) {
        customerSuccess = true;
      } else {
        customerError = new Error("Email sent but no messageId returned");
        console.error("❌ Customer email sent but invalid response");
      }
    } catch (customerErr) {
      customerError = customerErr;
      customerSuccess = false;
      console.error("❌ Failed to send customer email");
      console.error("Customer email error:", {
        code: customerErr.code,
        responseCode: customerErr.responseCode
      });
    }

    // Send email to admin
    let adminEmailResult = null;
    let adminError = null;
    let adminSuccess = false;
    
    try {
      adminEmailResult = await transporter.sendMail({
        from: fromEmail,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
      });
      
      // Validate that we got a valid response
      if (adminEmailResult && adminEmailResult.messageId) {
        adminSuccess = true;
      } else {
        adminError = new Error("Email sent but no messageId returned");
        console.error("❌ Admin email sent but invalid response");
      }
    } catch (adminErr) {
      adminError = adminErr;
      adminSuccess = false;
      console.error("❌ Failed to send admin email");
      console.error("Admin email error:", {
        code: adminErr.code,
        responseCode: adminErr.responseCode
      });
    }

    // Check if both emails were sent successfully
    if (!customerSuccess && !adminSuccess) {
      const errorMsg = customerError && adminError 
        ? `Both emails failed: Customer - ${customerError.message}, Admin - ${adminError.message}`
        : customerError 
          ? `Both emails failed: Customer - ${customerError.message}`
          : `Both emails failed: Admin - ${adminError.message}`;
      
      console.error("❌ Both emails failed to send");
      return {
        success: false,
        error: errorMsg,
        customerError: customerError?.message,
        adminError: adminError?.message,
        details: {
          customerCode: customerError?.code,
          adminCode: adminError?.code,
          customerResponse: customerError?.response,
          adminResponse: adminError?.response
        }
      };
    } else if (!customerSuccess) {
      console.error("❌ Customer email failed, admin succeeded");
      const invoiceAttached = !!(invoicePDFBuffer && invoiceId);
      return {
        success: false,
        error: `Customer email failed: ${customerError?.message || 'Unknown error'}`,
        customerError: customerError?.message,
        adminMessageId: adminEmailResult?.messageId,
        adminSuccess: true,
        invoiceAttached: invoiceAttached,
        invoiceId: invoiceId || null,
        details: {
          code: customerError?.code,
          responseCode: customerError?.responseCode,
          response: customerError?.response
        }
      };
    } else if (!adminSuccess) {
      console.error("❌ Admin email failed, customer succeeded");
      const invoiceAttached = !!(invoicePDFBuffer && invoiceId);
      return {
        success: false,
        error: `Admin email failed: ${adminError?.message || 'Unknown error'}`,
        customerMessageId: customerEmailResult?.messageId,
        customerSuccess: true,
        adminError: adminError?.message,
        invoiceAttached: invoiceAttached,
        invoiceId: invoiceId || null,
        details: {
          code: adminError?.code,
          responseCode: adminError?.responseCode,
          response: adminError?.response
        }
      };
    }

    // Both emails sent successfully
    const invoiceAttached = !!(invoicePDFBuffer && invoiceId);
    
    // NOW start invoice generation AFTER email is sent (completely non-blocking)
    // Only if invoice wasn't already attached and customer email succeeded
    if (status === 'SUCCESS' && amountInRupees > 0 && !invoicePDFBuffer && customerSuccess) {
      // Use setImmediate to ensure this runs AFTER the return statement completes
      // This ensures email sending is NEVER blocked by invoice generation
      setImmediate(() => {
        console.log(`🚀 Starting invoice generation in background for order: ${orderId}`);
        startInvoiceGenerationInBackground({
          orderId,
          customerName: customerName || 'Customer',
          customerEmail,
          customerPhone: finalCustomerMobile,
          customerAddress: '',
          amount: amountInRupees,
          packageType: packageType || 'single',
          transactionId: transactionId || '',
          fromEmail,
        }).catch((err) => {
          console.error(`❌ Background invoice generation error:`, err.message);
        });
      });
    }
    
    return {
      success: true,
      customerMessageId: customerEmailResult.messageId,
      adminMessageId: adminEmailResult.messageId,
      invoiceAttached: invoiceAttached,
      invoiceId: invoiceId || null,
      invoiceSize: invoicePDFBuffer ? invoicePDFBuffer.length : 0,
    };
  } catch (error) {
    console.error('Error sending emails');
    console.error('Error details:', {
      code: error.code,
      responseCode: error.responseCode
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      if (error.responseCode === 535) {
        errorMessage = 'SMTP Authentication failed. Please check your email credentials (SMTP_USER and SMTP_PASSWORD) in environment variables.';
      } else {
        errorMessage = `SMTP Authentication error (${error.responseCode}): ${error.response || error.message}`;
      }
    } else if (error.code === 'ECONNECTION') {
      errorMessage = `Cannot connect to SMTP server. Please check SMTP_HOST and SMTP_PORT settings.`;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'SMTP connection timeout. Please check your network and SMTP server settings.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: {
        code: error.code,
        responseCode: error.responseCode,
        response: error.response
      }
    };
  }
}
