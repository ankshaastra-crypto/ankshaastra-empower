import nodemailer from 'nodemailer';

// Create SMTP transporter
const createTransporter = () => {
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
  };
  
  // Log configuration (without password) for debugging
  console.log("SMTP Configuration:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    hasPassword: !!config.auth.pass,
    passwordLength: config.auth.pass ? config.auth.pass.length : 0,
    rejectUnauthorized: config.tls.rejectUnauthorized
  });
  
  return nodemailer.createTransport(config);
};

export async function sendPaymentEmail({ 
  to, 
  customerEmail, 
  customerName, 
  orderId, 
  amount, 
  packageType, 
  status, 
  transactionId 
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ankshaastra.com';
  const fromEmail = process.env.FROM_EMAIL || 'Ankshaastra <noreply@ankshaastra.com>';
  
  // Validate required parameters
  if (!customerEmail || !orderId) {
    console.error('Missing required parameters for email:', { customerEmail, orderId });
    return {
      success: false,
      error: 'Missing required parameters: customerEmail and orderId are required.',
    };
  }

  // Validate SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('SMTP configuration is missing');
    return {
      success: false,
      error: 'SMTP configuration is missing. Please check your environment variables.',
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
  
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${status === 'SUCCESS' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { background: ${status === 'SUCCESS' ? '#10b981' : '#dc2626'}; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
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
            <div class="detail-row">
              <strong>Order ID:</strong>
              <span>${orderId}</span>
            </div>
            <div class="detail-row">
              <strong>Customer Name:</strong>
              <span>${customerName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <strong>Customer Email:</strong>
              <span>${customerEmail}</span>
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
              <span>${status}</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter();

    // Verify SMTP connection before sending
    console.log("Verifying SMTP connection...");
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
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
    console.log(`Sending customer email to: ${customerEmail}`);
    let customerEmailResult = null;
    let customerError = null;
    
    try {
      customerEmailResult = await transporter.sendMail({
        from: fromEmail,
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
      });
      console.log("Customer email sent successfully:", customerEmailResult.messageId);
    } catch (customerErr) {
      customerError = customerErr;
      console.error("Failed to send customer email:", customerErr);
      console.error("Customer email error details:", {
        code: customerErr.code,
        response: customerErr.response,
        responseCode: customerErr.responseCode,
        command: customerErr.command,
        message: customerErr.message
      });
    }

    // Send email to admin
    console.log(`Sending admin email to: ${adminEmail}`);
    let adminEmailResult = null;
    let adminError = null;
    
    try {
      adminEmailResult = await transporter.sendMail({
        from: fromEmail,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
      });
      console.log("Admin email sent successfully:", adminEmailResult.messageId);
    } catch (adminErr) {
      adminError = adminErr;
      console.error("Failed to send admin email:", adminErr);
      console.error("Admin email error details:", {
        code: adminErr.code,
        response: adminErr.response,
        responseCode: adminErr.responseCode,
        command: adminErr.command,
        message: adminErr.message
      });
    }

    // Check if both emails were sent successfully
    if (customerError && adminError) {
      return {
        success: false,
        error: "Both customer and admin emails failed to send",
        customerError: customerError.message,
        adminError: adminError.message,
        details: {
          customerCode: customerError.code,
          adminCode: adminError.code
        }
      };
    } else if (customerError) {
      return {
        success: false,
        error: `Customer email failed: ${customerError.message}`,
        customerError: customerError.message,
        adminMessageId: adminEmailResult?.messageId,
        details: {
          code: customerError.code,
          responseCode: customerError.responseCode
        }
      };
    } else if (adminError) {
      return {
        success: false,
        error: `Admin email failed: ${adminError.message}`,
        customerMessageId: customerEmailResult?.messageId,
        adminError: adminError.message,
        details: {
          code: adminError.code,
          responseCode: adminError.responseCode
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
    console.error('Error sending emails:', error);
    console.error('Error details:', {
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
      message: error.message
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
