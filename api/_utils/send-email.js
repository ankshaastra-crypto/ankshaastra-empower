// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js';

import nodemailer from 'nodemailer';
import { recordEmailDelivery, isEmailSent } from './db.js';

// Reuse transporter instance (singleton pattern) for better performance
let transporterInstance = null;

// Create SMTP transporter (singleton) - internal use only
const getTransporter = () => {
  // Validate SMTP configuration before creating transporter
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP configuration is missing. Please check your environment variables (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).');
  }

  // Recreate transporter if config has changed or if it doesn't exist
  const currentConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  };

  // Check if we need to recreate the transporter (config changed or doesn't exist)
  if (!transporterInstance) {
    const config = {
      host: currentConfig.host,
      port: currentConfig.port,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: currentConfig.user,
        pass: currentConfig.pass,
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
    
    console.log('📧 Creating SMTP transporter with config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      hasPassword: !!config.auth.pass,
    });
    
    transporterInstance = nodemailer.createTransport(config);
  }
  
  return transporterInstance;
};

export async function sendPaymentEmail({ 
  to, 
  customerEmail, 
  orderId,
  customerName, 
  customerMobile = '',
  customerDob = '',
  customerGender = '',
  customerCity = '',
  person1Name = '',
  person1FirstName = '',
  person1MiddleName = '',
  person1SurName = '',
  person1Dob = '',
  person1Gender = '',
  person1MiddleNameType = '',
  person2Name = '',
  person2FirstName = '',
  person2MiddleName = '',
  person2SurName = '',
  person2Dob = '',
  person2Gender = '',
  person2MiddleNameType = '',
  person3Name = '',
  person3FirstName = '',
  person3MiddleName = '',
  person3SurName = '',
  person3Dob = '',
  person3Gender = '',
  person3MiddleNameType = '',
  fatherFirstName = '',
  fatherMiddleName = '',
  fatherMiddleNameType = '',
  fatherLastName = '',
  fatherFullName = '',
  childMiddleName = '',
  childLastName = '',
  fatherFirstNameAsMiddleName = '',
  nameOptions = '',
  childDob = '',
  timeOfBirth = '',
  placeOfBirth = '',
  pinCode = '',
  amount, 
  packageType, 
  status, 
  transactionId,
  invoicePdfBuffer = null,
}) {
  // ─── DEDUPLICATION CHECK ─────────────────────────────────────────────────
  // One email per order per recipient — prevents double-send from webhook + status
  try {
    if (await isEmailSent(customerEmail, orderId)) {
      console.log(`⏭️  Email already sent for order ${orderId} → ${customerEmail} — skipping`);
      return { success: true, skipped: true, reason: 'already_sent' };
    }
  } catch (dedupErr) {
    // DB check failed — log and continue (better to send than silently drop)
    console.warn('⚠️  Dedup check failed (sending anyway):', dedupErr.message);
  }
  const adminEmail = 'social@ankshaastra.com';
  const fromEmail = process.env.FROM_EMAIL || 'Ankshaastra <noreply@ankshaastra.com>';

  
  // Normalize values
  const finalCustomerMobile = (customerMobile && customerMobile.toString().trim()) || '';
  const finalCustomerDob = (customerDob && customerDob.toString().trim()) || '';
  const finalCustomerGender = (customerGender && customerGender.toString().trim()) || '';
  const finalCustomerCity = (customerCity && customerCity.toString().trim()) || '';
  const finalPerson1Name = (person1Name && person1Name.toString().trim()) || (customerName && customerName.toString().trim()) || '';
  const finalPerson1Dob = (person1Dob && person1Dob.toString().trim()) || finalCustomerDob;
  const finalPerson1Gender = (person1Gender && person1Gender.toString().trim()) || finalCustomerGender;
  const finalPerson1MiddleNameType = (person1MiddleNameType && person1MiddleNameType.toString().trim()) || '';
  const finalPerson1FirstName = (person1FirstName && person1FirstName.toString().trim()) || '';
  const finalPerson1MiddleName = (person1MiddleName && person1MiddleName.toString().trim()) || '';
  const finalPerson1SurName = (person1SurName && person1SurName.toString().trim()) || '';
  const finalPerson2Name = (person2Name && person2Name.toString().trim()) || '';
  const finalPerson2FirstName = (person2FirstName && person2FirstName.toString().trim()) || '';
  const finalPerson2MiddleName = (person2MiddleName && person2MiddleName.toString().trim()) || '';
  const finalPerson2SurName = (person2SurName && person2SurName.toString().trim()) || '';
  const finalPerson2Dob = (person2Dob && person2Dob.toString().trim()) || '';
  const finalPerson2Gender = (person2Gender && person2Gender.toString().trim()) || '';
  const finalPerson2MiddleNameType = (person2MiddleNameType && person2MiddleNameType.toString().trim()) || '';
  const finalPerson3Name = (person3Name && person3Name.toString().trim()) || '';
  const finalPerson3FirstName = (person3FirstName && person3FirstName.toString().trim()) || '';
  const finalPerson3MiddleName = (person3MiddleName && person3MiddleName.toString().trim()) || '';
  const finalPerson3SurName = (person3SurName && person3SurName.toString().trim()) || '';
  const finalPerson3Dob = (person3Dob && person3Dob.toString().trim()) || '';
  const finalPerson3Gender = (person3Gender && person3Gender.toString().trim()) || '';
  const finalPerson3MiddleNameType = (person3MiddleNameType && person3MiddleNameType.toString().trim()) || '';
  
  // Baby report specific fields
  const finalFatherFirstName = (fatherFirstName && fatherFirstName.toString().trim()) || '';
  const finalFatherMiddleName = (fatherMiddleName && fatherMiddleName.toString().trim()) || '';
  const finalFatherMiddleNameType = (fatherMiddleNameType && fatherMiddleNameType.toString().trim()) || '';
  const finalFatherLastName = (fatherLastName && fatherLastName.toString().trim()) || '';
  const finalFatherFullName = (fatherFullName && fatherFullName.toString().trim()) || '';
  const finalChildMiddleName = (childMiddleName && childMiddleName.toString().trim()) || '';
  const finalChildLastName = (childLastName && childLastName.toString().trim()) || '';
  const finalFatherFirstNameAsMiddleName = (fatherFirstNameAsMiddleName && fatherFirstNameAsMiddleName.toString().trim()) || '';
  const finalNameOptions = (nameOptions && nameOptions.toString().trim()) || '';
  const finalChildDob = (childDob && childDob.toString().trim()) || '';
  const finalTimeOfBirth = (timeOfBirth && timeOfBirth.toString().trim()) || '';
  const finalPlaceOfBirth = (placeOfBirth && placeOfBirth.toString().trim()) || '';
  const finalPinCode = (pinCode && pinCode.toString().trim()) || '';
  
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

  // Validate FROM_EMAIL format (should be either "email@domain.com" or "Name <email@domain.com>")
  const fromEmailRegex = /^(.+?)\s*<(.+?)>$|^(.+?)$/;
  const fromEmailMatch = fromEmail.match(fromEmailRegex);
  const actualFromEmail = fromEmailMatch ? (fromEmailMatch[2] || fromEmailMatch[3] || fromEmailMatch[1]) : fromEmail;
  if (!emailRegex.test(actualFromEmail)) {
    console.error('❌ Invalid FROM_EMAIL format:', fromEmail);
    return {
      success: false,
      error: `Invalid FROM_EMAIL format: ${fromEmail}. Should be either "email@domain.com" or "Name <email@domain.com>"`,
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

  // Determine package name based on packageType
  // namecheck can have sub-packages: namecheck-1, namecheck-2, namecheck-3
  let packageName = packageType || 'Unknown Package';
  
  if (packageType && packageType.startsWith('namecheck-')) {
    const count = packageType.split('-')[1] || '1';
    packageName = `Name Check (${count} Person${count !== '1' ? 's' : ''})`;
  } else if (packageType === 'namecheck') {
    packageName = 'Name Check';
  } else if (packageType === 'single') {
    packageName = 'Single Report';
  }
  // Amount is expected in paise (smallest currency unit), convert to rupees for display
  // Handle edge case where amount might be 0 or undefined
  const amountInRupees = amount && amount > 0 ? amount / 100 : 0;
  const amountFormatted = `₹${amountInRupees.toLocaleString('en-IN')}`;
  
  // Customer email template
  const customerSubject = status === 'SUCCESS' 
    ? `Payment Successful - Order ${orderId}`
    : `Payment Failed - Order ${orderId}`;


  // GST calculation - prices are GST-INCLUSIVE, back-calculate subtotal
  const pin = parseInt(finalPinCode || '0', 10);
  const isIntraState = pin >= 200000 && pin <= 289999;
  const totalWithGst = amountInRupees; // amount paid = GST-inclusive
  const subtotal = +(totalWithGst / 1.18).toFixed(2);
  const cgstRate = isIntraState ? 9 : 0;
  const sgstRate = isIntraState ? 9 : 0;
  const igstRate = isIntraState ? 0 : 18;
  const cgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
  const sgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
  const igstAmount = isIntraState ? 0 : +(subtotal * 0.18).toFixed(2);
  const subtotalFormatted = `₹${subtotal.toLocaleString('en-IN')}`;
  const totalWithGstFormatted = `₹${totalWithGst.toLocaleString('en-IN')}`;

  // GST breakdown rows for invoice
  const gstBreakdownHtml = isIntraState
    ? `
      <tr><td style="padding: 5px 10px; font-size: 12px; text-align: right;" colspan="3">CGST (${cgstRate}%):</td><td style="padding: 5px 10px; font-size: 12px; text-align: right;">₹${cgstAmount.toLocaleString('en-IN')}</td></tr>
      <tr><td style="padding: 5px 10px; font-size: 12px; text-align: right;" colspan="3">SGST (${sgstRate}%):</td><td style="padding: 5px 10px; font-size: 12px; text-align: right;">₹${sgstAmount.toLocaleString('en-IN')}</td></tr>
    `
    : `
      <tr><td style="padding: 5px 10px; font-size: 12px; text-align: right;" colspan="3">IGST (${igstRate}%):</td><td style="padding: 5px 10px; font-size: 12px; text-align: right;">₹${igstAmount.toLocaleString('en-IN')}</td></tr>
    `;

  // Build invoice HTML section for customer success email
  const invoiceHtml = `
    <div style="margin-top: 30px; border-top: 2px solid #C9A84C; padding-top: 20px;">
      <h2 style="color: #2E1A47; text-align: center; margin-bottom: 20px; font-size: 20px;">TAX INVOICE</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 50%;">
            <strong style="color: #2E1A47;">From:</strong><br/>
            <span style="font-size: 14px; font-weight: bold; color: #C9A84C;">Ankshaastra</span><br/>
            <span style="font-size: 11px; color: #666;">Empower Your Name</span><br/>
            <span style="font-size: 11px; color: #666;">Unit No. O-622, Block-E, Eye of Noida,<br/>Sector 140A, Noida-201305</span><br/>
            <span style="font-size: 11px; color: #666;">Phone: 9667305577</span><br/>
            <span style="font-size: 11px; color: #666;">Email: social@ankshaastra.com</span><br/>
            <span style="font-size: 11px; color: #666;">GSTIN: 09AAFFE7583B1ZD</span>
          </td>
          <td style="padding: 8px 0; vertical-align: top; width: 50%; text-align: right;">
            <strong style="color: #2E1A47;">Bill To:</strong><br/>
            <span style="font-size: 12px; color: #333;">${customerName || 'Customer'}</span><br/>
            <span style="font-size: 11px; color: #666;">${customerEmail}</span><br/>
            ${finalCustomerMobile ? '<span style="font-size: 11px; color: #666;">Phone: ' + finalCustomerMobile + '</span><br/>' : ''}
            ${finalCustomerCity ? '<span style="font-size: 11px; color: #666;">' + finalCustomerCity + '</span><br/>' : ''}
            ${finalPinCode ? '<span style="font-size: 11px; color: #666;">PIN: ' + finalPinCode + '</span>' : ''}
          </td>
        </tr>
      </table>

      <table style="width: 100%; margin-bottom: 10px;">
        <tr>
          <td style="font-size: 12px; color: #333;"><strong>Order ID:</strong> ${orderId}</td>
          <td style="font-size: 12px; color: #333; text-align: right;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
        </tr>
        ${transactionId ? '<tr><td style="font-size: 12px; color: #333;"><strong>Transaction ID:</strong> ' + transactionId + '</td><td></td></tr>' : ''}
      </table>

      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background: #2E1A47;">
            <th style="color: white; padding: 10px; text-align: left; font-size: 12px;">Description</th>
            <th style="color: white; padding: 10px; text-align: center; font-size: 12px;">HSN/SAC</th>
            <th style="color: white; padding: 10px; text-align: center; font-size: 12px;">Qty</th>
            <th style="color: white; padding: 10px; text-align: right; font-size: 12px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-size: 12px;">${packageName}<br/><small style="color: #666;">Numerology Report</small></td>
            <td style="padding: 10px; text-align: center; font-size: 12px;">998399</td>
            <td style="padding: 10px; text-align: center; font-size: 12px;">1</td>
            <td style="padding: 10px; text-align: right; font-size: 12px;">${subtotalFormatted}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td style="padding: 5px 10px; font-size: 12px; text-align: right; border-top: 1px solid #eee;" colspan="3"><strong>Subtotal:</strong></td><td style="padding: 5px 10px; font-size: 12px; text-align: right; border-top: 1px solid #eee;">${subtotalFormatted}</td></tr>
          ${gstBreakdownHtml}
          <tr style="background: #f5f0ff;"><td style="padding: 8px 10px; font-size: 14px; text-align: right; border-top: 2px solid #2E1A47;" colspan="3"><strong style="color: #2E1A47;">Total Amount:</strong></td><td style="padding: 8px 10px; font-size: 14px; text-align: right; border-top: 2px solid #2E1A47; color: #2E1A47;"><strong>${totalWithGstFormatted}</strong></td></tr>
        </tfoot>
      </table>

      <div style="margin-top: 20px; padding: 12px; background: #f9f9f9; border-radius: 6px;">
        <p style="font-size: 11px; color: #666; margin: 0;">
          <strong>Bank Details:</strong> Axis Bank | A/C: 925020055368236 | IFSC: UTIB0001837 | Ankshaastra Occult Experts LLP | Branch: Agra Road
        </p>
        <p style="font-size: 11px; color: #666; margin: 4px 0 0 0;"><strong>UPI:</strong> razorpay.me/@ankshaastraoccultexpertsllp</p>
      </div>

      <p style="font-size: 10px; color: #999; margin-top: 15px; text-align: center;">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  `;

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
                <span>${transactionId || 'Pending'}</span>
              </div>
            </div>

            <p>Your personalized numerology report will be delivered to this email address within 24-48 hours.</p>
            <p>If you have any questions, please contact us at <a href="tel:9667305577">9667305577</a>.</p>
            
            ${invoiceHtml}

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
            ${invoiceHtml}
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  // Admin email template
  const adminSubject = `Payment ${status === 'SUCCESS' ? 'Success' : 'Failed'} - Order ${orderId}`;
  
  // Format DOB for display (never use N/A for email content)
  const formatDob = (dob) => {
    if (!dob || dob.trim() === '') return 'Not provided';
    try {
      const date = new Date(dob);
      if (isNaN(date.getTime())) return dob; // If invalid date, return as-is
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dob || 'Not provided';
    }
  };

  // Helper to check if value exists
  const hasValue = (value) => {
    return value && value.toString().trim() !== '';
  };

  // Build customer details section
  let customerDetailsHtml = '';
  
  // Determine number of persons based on package type
  let personCount = 1; // Default to 1 person
  
  if (packageType && packageType.startsWith('namecheck-')) {
    // Extract count from namecheck-1, namecheck-2, namecheck-3
    const countStr = packageType.split('-')[1] || '1';
    personCount = parseInt(countStr, 10) || 1;
  }
  
  // Helper: build name section - show First, Middle, Last as separate fields when available
  const buildNameSection = (firstName, middleName, surName, fullName) => {
    const hasParts = hasValue(firstName) || hasValue(middleName) || hasValue(surName);
    if (hasParts) {
      let html = '';
      if (hasValue(firstName)) html += `<div class="detail-row"><strong>First Name:</strong><span>${firstName}</span></div>`;
      if (hasValue(middleName)) html += `<div class="detail-row"><strong>Middle Name:</strong><span>${middleName}</span></div>`;
      if (hasValue(surName)) html += `<div class="detail-row"><strong>Last Name:</strong><span>${surName}</span></div>`;
      return html;
    }
    return `<div class="detail-row"><strong>Name:</strong><span>${hasValue(fullName) ? fullName : 'Not provided'}</span></div>`;
  };

  if (personCount > 1) {
    // Multiple persons - show each person with First, Middle, Last Name separately
    const persons = [
      { firstName: finalPerson1FirstName, middleName: finalPerson1MiddleName, surName: finalPerson1SurName, name: finalPerson1Name, dob: finalPerson1Dob, gender: finalPerson1Gender, middleNameType: finalPerson1MiddleNameType },
      { firstName: finalPerson2FirstName, middleName: finalPerson2MiddleName, surName: finalPerson2SurName, name: finalPerson2Name, dob: finalPerson2Dob, gender: finalPerson2Gender, middleNameType: finalPerson2MiddleNameType },
      { firstName: finalPerson3FirstName, middleName: finalPerson3MiddleName, surName: finalPerson3SurName, name: finalPerson3Name, dob: finalPerson3Dob, gender: finalPerson3Gender, middleNameType: finalPerson3MiddleNameType },
    ];
    
    customerDetailsHtml = persons
      .slice(0, personCount)
      .map((person, index) => `
        <div class="person-section">
          <h3 style="color: #2E1A47; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #2E1A47; padding-bottom: 5px;">Person ${index + 1} Details:</h3>
          ${buildNameSection(person.firstName, person.middleName, person.surName, person.name)}
          <div class="detail-row">
            <strong>Date of Birth:</strong>
            <span>${formatDob(person.dob)}</span>
          </div>
          <div class="detail-row">
            <strong>Gender:</strong>
            <span>${hasValue(person.gender) ? person.gender : 'Not provided'}</span>
          </div>
          ${hasValue(person.middleNameType) ? `
          <div class="detail-row">
            <strong>Middle Name is Father's/Husband's:</strong>
            <span>${person.middleNameType === 'yes' ? 'Yes' : 'No'}</span>
          </div>
          ` : ''}
        </div>
      `)
      .join('');
   } else if (packageType === 'single' || packageType === 'premium' || packageType === 'baby_name') {
    // Baby Name Report / Premium - show baby-specific details
    customerDetailsHtml = `
      <div class="detail-row">
        <strong>Father's Full Name:</strong>
        <span>${hasValue(finalFatherFullName) ? finalFatherFullName : (hasValue(finalFatherFirstName) ? finalFatherFirstName : 'Not provided')}</span>
      </div>
      ${hasValue(finalChildMiddleName) ? `
      <div class="detail-row">
        <strong>Child's Middle Name:</strong>
        <span>${finalChildMiddleName}</span>
      </div>
      ` : ''}
      ${hasValue(finalChildLastName) ? `
      <div class="detail-row">
        <strong>Child's Last Name:</strong>
        <span>${finalChildLastName}</span>
      </div>
      ` : ''}
      ${hasValue(finalFatherFirstNameAsMiddleName) ? `
      <div class="detail-row">
        <strong>Child's Middle Name = Father's First Name:</strong>
        <span>${finalFatherFirstNameAsMiddleName === 'yes' ? 'Yes' : 'No'}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <strong>Child's Date of Birth:</strong>
        <span>${hasValue(finalChildDob) ? formatDob(finalChildDob) : formatDob(finalPerson1Dob)}</span>
      </div>
      ${hasValue(finalTimeOfBirth) ? `
      <div class="detail-row">
        <strong>Time of Birth:</strong>
        <span>${finalTimeOfBirth}</span>
      </div>
      ` : ''}
      ${hasValue(finalPlaceOfBirth) ? `
      <div class="detail-row">
        <strong>Place of Birth:</strong>
        <span>${finalPlaceOfBirth}</span>
      </div>
      ` : ''}
      ${hasValue(finalPinCode) ? `
      <div class="detail-row">
        <strong>Pin Code:</strong>
        <span>${finalPinCode}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <strong>Gender:</strong>
        <span>${hasValue(finalPerson1Gender) ? finalPerson1Gender : (hasValue(finalCustomerGender) ? finalCustomerGender : 'Not provided')}</span>
      </div>
      ${hasValue(finalNameOptions) ? `
      <div class="detail-row">
        <strong>Name Options:</strong>
        <span>${finalNameOptions}</span>
      </div>
      ` : ''}
    `;
  } else {
    // Single person Name Check - show First, Middle, Last Name separately when available
    customerDetailsHtml = `
      ${buildNameSection(finalPerson1FirstName, finalPerson1MiddleName, finalPerson1SurName, finalPerson1Name)}
      <div class="detail-row">
        <strong>Date of Birth:</strong>
        <span>${formatDob(finalPerson1Dob)}</span>
      </div>
      <div class="detail-row">
        <strong>Gender:</strong>
        <span>${hasValue(finalPerson1Gender) ? finalPerson1Gender : 'Not provided'}</span>
      </div>
      ${hasValue(finalPerson1MiddleNameType) ? `
      <div class="detail-row">
        <strong>Middle Name is Father's/Husband's:</strong>
        <span>${finalPerson1MiddleNameType === 'yes' ? 'Yes' : 'No'}</span>
      </div>
      ` : ''}
    `;
  }
  
  // Build WhatsApp-style full summary for admin email
  const buildAdminSummary = () => {
    const isBaby = packageType === 'single' || packageType === 'premium';
    let details = '';
    if (isBaby) {
      const fatherName = finalFatherFullName || [finalFatherFirstName, finalFatherMiddleName, finalFatherLastName].filter(Boolean).join(' ') || '';
      const childDobVal = finalChildDob || finalCustomerDob || '';
      const genderVal = finalCustomerGender || finalPerson1Gender || '';
      details += fatherName ? `<p><strong>Father's Full Name:</strong> ${fatherName}</p>` : '<p><strong>Father\'s Full Name:</strong> N/A</p>';
      details += `<p><strong>Child's DOB:</strong> ${childDobVal || 'N/A'}</p>`;
      details += `<p><strong>Time of Birth:</strong> ${finalTimeOfBirth || 'N/A'}</p>`;
      details += `<p><strong>Birth City:</strong> ${finalPlaceOfBirth || 'N/A'}</p>`;
      details += `<p><strong>Pin Code:</strong> ${finalPinCode || 'N/A'}</p>`;
      details += `<p><strong>Child's Gender:</strong> ${genderVal || 'N/A'}</p>`;
      details += finalChildMiddleName ? `<p><strong>Child's Middle Name:</strong> ${finalChildMiddleName}</p>` : '';
      details += finalChildLastName ? `<p><strong>Child's Last Name:</strong> ${finalChildLastName}</p>` : '';
      details += finalFatherFirstNameAsMiddleName ? `<p><strong>Father's First Name as Middle Name:</strong> ${finalFatherFirstNameAsMiddleName === 'yes' ? 'Yes' : 'No'}</p>` : '';
      details += finalNameOptions ? `<p><strong>Preferred Name Options:</strong> ${finalNameOptions}</p>` : '';
    }
    return details;
  };

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
        .wa-summary { background: #f0f7ff; border-left: 4px solid #2E1A47; padding: 15px; border-radius: 5px; margin: 15px 0; font-size: 13px; }
        .wa-summary p { margin: 4px 0; }
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
            <div class="detail-row"><strong>Order ID:</strong><span>${orderId}</span></div>
            <div class="detail-row"><strong>Package:</strong><span>${packageName}</span></div>
            <div class="detail-row"><strong>Amount:</strong><span>${amountFormatted}</span></div>
            <div class="detail-row"><strong>Transaction ID:</strong><span>${transactionId || 'Pending'}</span></div>
            <div class="detail-row"><strong>Status:</strong><span style="color: ${status === 'SUCCESS' ? '#10b981' : '#dc2626'}; font-weight: bold;">${status}</span></div>
          </div>

          <div class="details">
            <h2 style="color: #2E1A47; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #2E1A47; padding-bottom: 10px;">Customer Contact</h2>
            <div class="contact-info">
              <div class="detail-row"><strong>Name:</strong><span>${customerName || 'N/A'}</span></div>
              <div class="detail-row"><strong>Email:</strong><span><a href="mailto:${customerEmail}" style="color: #2E1A47;">${customerEmail || 'N/A'}</a></span></div>
              <div class="detail-row"><strong>Mobile:</strong><span><a href="tel:${finalCustomerMobile || ''}" style="color: #2E1A47;">${finalCustomerMobile || 'N/A'}</a></span></div>
              <div class="detail-row"><strong>City:</strong><span>${finalCustomerCity || 'N/A'}</span></div>
              ${finalPinCode ? `<div class="detail-row"><strong>Pin Code:</strong><span>${finalPinCode}</span></div>` : ''}
            </div>
          </div>

          <div class="details">
            <h2 style="color: #2E1A47; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #2E1A47; padding-bottom: 10px;">Order Details (Form Filled)</h2>
            ${customerDetailsHtml}
            <div class="wa-summary">
              <h3 style="color: #2E1A47; margin: 0 0 10px 0; font-size: 14px;">📋 Baby/Child Report Details</h3>
              ${buildAdminSummary()}
            </div>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 Starting email sending process for order: ${orderId}`);
    
    // Get transporter - this will throw if config is missing
    let transporter;
    try {
      transporter = getTransporter();
    } catch (transporterError) {
      console.error("❌ Failed to create SMTP transporter:", transporterError.message);
      return {
        success: false,
        error: transporterError.message,
        details: {
          type: 'TRANSPORTER_CREATION_ERROR'
        }
      };
    }

    // Verify SMTP connection before sending
    try {
      console.log(`🔍 Verifying SMTP connection...`);
      await transporter.verify();
      console.log(`✅ SMTP connection verified`);
    } catch (verifyError) {
      console.error("❌ SMTP verification failed:", verifyError.message);
      console.error("Verification error details:", {
        code: verifyError.code,
        response: verifyError.response,
        responseCode: verifyError.responseCode,
        command: verifyError.command,
        stack: verifyError.stack
      });
      return {
        success: false,
        error: `SMTP connection failed: ${verifyError.message}`,
        details: {
          code: verifyError.code,
          response: verifyError.response,
          responseCode: verifyError.responseCode,
          command: verifyError.command
        }
      };
    }

    // Send email to customer
    console.log(`📧 Sending customer email to: ${customerEmail}`);
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
      if (invoicePdfBuffer && status === 'SUCCESS') {
        customerMailOptions.attachments = [{
          filename: `Invoice_${orderId}.pdf`,
          content: invoicePdfBuffer,
          contentType: 'application/pdf',
        }];
      }

      customerEmailResult = await transporter.sendMail(customerMailOptions);
      
      // Validate that we got a valid response
      if (customerEmailResult && customerEmailResult.messageId) {
        customerSuccess = true;
        console.log(`✅ Customer email sent successfully! Message ID: ${customerEmailResult.messageId}`);
        try {
          const { recordEmailDelivery } = await import('./db.js');
          await recordEmailDelivery(customerEmail, orderId, 'sent');
        } catch {
          /* non-fatal */
        }
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
        responseCode: customerErr.responseCode,
        message: customerErr.message
      });
    }

    // Send email to admin
console.log(`📧 Admin email prepared for orderId: ${orderId}, to: ${adminEmail}`);
    let adminEmailResult = null;
    let adminError = null;
    let adminSuccess = false;
    
    try {
      const adminMailOptions = {
        from: fromEmail,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
      };

      // Attach invoice PDF if available
      if (invoicePdfBuffer && status === 'SUCCESS') {
        adminMailOptions.attachments = [{
          filename: `Invoice_${orderId}.pdf`,
          content: invoicePdfBuffer,
          contentType: 'application/pdf',
        }];
      }

      adminEmailResult = await transporter.sendMail(adminMailOptions);
      
      // Validate that we got a valid response
      if (adminEmailResult && adminEmailResult.messageId) {
        adminSuccess = true;
        console.log(`✅ Admin email sent successfully! Message ID: ${adminEmailResult.messageId}`);
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
        responseCode: adminErr.responseCode,
        message: adminErr.message
      });
    }

    console.log(`📊 Email sending summary - Customer: ${customerSuccess ? '✅' : '❌'}, Admin: ${adminSuccess ? '✅' : '❌'}`);

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