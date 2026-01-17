import nodemailer from 'nodemailer';
import { generateInvoicePDF } from './invoice-helper.js';
import { queueInvoiceGeneration } from './invoice-queue.js';

// Reuse transporter instance (singleton pattern) for better performance
let transporterInstance = null;

// Create SMTP transporter (singleton)
const getTransporter = () => {
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
  
  if (status === 'SUCCESS' && amountInRupees > 0 && !invoicePDFBuffer) {
    try {
      if (useQueue) {
        // Try queue system for async invoice generation
        try {
          const invoiceData = {
            orderId,
            customerName: customerName || 'Customer',
            customerEmail,
            customerPhone: finalCustomerMobile,
            customerAddress: '',
            amount: amountInRupees,
            packageType: packageType || 'single',
            transactionId: transactionId || '',
            invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          };
          
          const emailData = {
            to,
            customerEmail,
            customerName,
            customerMobile: finalCustomerMobile,
            customerDob: finalCustomerDob,
            person1Name: finalPerson1Name,
            person1Dob: finalPerson1Dob,
            person2Name: finalPerson2Name,
            person2Dob: finalPerson2Dob,
            person3Name: finalPerson3Name,
            person3Dob: finalPerson3Dob,
            orderId,
            amount,
            packageType,
            status,
            transactionId,
          };
          
          // Queue invoice generation (will send email after PDF is ready)
          await queueInvoiceGeneration(invoiceData, emailData);
          
          // Return immediately - email will be sent by queue worker
          invoiceNoteHtml = '<p style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;"><strong>📄 Invoice Processing:</strong> Your invoice is being generated and will be sent shortly.</p>';
          
          // Send immediate confirmation email without invoice
          // (Invoice email will be sent by queue worker)
          console.log(`✅ Invoice queued successfully for order: ${orderId}`);
        } catch (queueError) {
          // Queue failed (Redis unavailable), fall back to synchronous generation
          console.warn(`⚠️ Queue unavailable, falling back to synchronous invoice generation: ${queueError.message}`);
          useQueue = false; // Force synchronous mode
          // Continue to synchronous generation below
        }
      }
      
      if (!useQueue) {
        // Synchronous generation (fallback)
        console.log(`📄 Generating invoice PDF synchronously for order: ${orderId}`);
        const invoiceResult = await generateInvoicePDF({
          orderId,
          customerName: customerName || 'Customer',
          customerEmail,
          customerPhone: finalCustomerMobile,
          customerAddress: '',
          amount: amountInRupees,
          packageType: packageType || 'single',
          transactionId: transactionId || '',
          invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        });
        
        // Validate invoice result
        if (invoiceResult && invoiceResult.pdfBuffer && invoiceResult.invoiceId) {
          invoicePDFBuffer = invoiceResult.pdfBuffer;
          invoiceId = invoiceResult.invoiceId;
          invoiceNoteHtml = '<p style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;"><strong>📄 Invoice Attached:</strong> Your invoice has been attached to this email for your records.</p>';
          console.log(`✅ Invoice PDF generated successfully: ${invoiceId}, Buffer size: ${invoicePDFBuffer.length} bytes`);
        } else {
          throw new Error(`Invalid invoice result: missing pdfBuffer or invoiceId. Result: ${JSON.stringify(invoiceResult ? Object.keys(invoiceResult) : 'null')}`);
        }
      }
    } catch (invoiceError) {
      console.error('❌ Failed to generate invoice PDF:', invoiceError);
      console.error('Invoice error details:', {
        message: invoiceError.message,
        stack: invoiceError.stack,
        orderId,
        amountInRupees,
      });
      // Continue with email sending even if invoice generation fails
      // But log clearly that no attachment will be sent
      invoiceNoteHtml = '<p style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;"><strong>⚠️ Invoice Generation Issue:</strong> Your payment was successful, but we encountered an issue generating your invoice. Please contact support with your Order ID for assistance.</p>';
    }
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
      return {
        success: false,
        error: `Customer email failed: ${customerError?.message || 'Unknown error'}`,
        customerError: customerError?.message,
        adminMessageId: adminEmailResult?.messageId,
        adminSuccess: true,
        details: {
          code: customerError?.code,
          responseCode: customerError?.responseCode,
          response: customerError?.response
        }
      };
    } else if (!adminSuccess) {
      console.error("❌ Admin email failed, customer succeeded");
      return {
        success: false,
        error: `Admin email failed: ${adminError?.message || 'Unknown error'}`,
        customerMessageId: customerEmailResult?.messageId,
        customerSuccess: true,
        adminError: adminError?.message,
        details: {
          code: adminError?.code,
          responseCode: adminError?.responseCode,
          response: adminError?.response
        }
      };
    }

    // Both emails sent successfully
    return {
      success: true,
      customerMessageId: customerEmailResult.messageId,
      adminMessageId: adminEmailResult.messageId,
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
