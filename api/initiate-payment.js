// Use 'import' instead of 'require'
import crypto from 'crypto';

export default async function handler(req, res) {
  // Only allow POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, mobile, orderId, email, name, dob, packageType, person1Name, person1Dob, person2Name, person2Dob, person3Name, person3Dob } = req.body;

    // Get your keys from Vercel Environment Variables
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    // Validate environment variables
    if (!merchantId || !saltKey || !saltIndex) {
      console.error("Missing PhonePe credentials:", {
        hasMerchantId: !!merchantId,
        hasSaltKey: !!saltKey,
        hasSaltIndex: !!saltIndex
      });
      return res.status(500).json({ 
        success: false,
        error: "Payment configuration error. Please check PhonePe API keys in environment variables.",
        message: "PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, and PHONEPE_SALT_INDEX must be set."
      });
    }

    // Build redirect URL with customer information and orderId as query parameters
    // We include orderId because PhonePe might not include merchantTransactionId in redirect
    const redirectParams = new URLSearchParams();
    redirectParams.append('orderId', orderId); // Include orderId so we can check payment status
    if (email && email.trim()) redirectParams.append('email', email.trim());
    if (name && name.trim()) redirectParams.append('name', name.trim());
    if (mobile && mobile.trim()) redirectParams.append('mobile', mobile.trim());
    if (dob && dob.trim()) redirectParams.append('dob', dob.trim());
    if (packageType && packageType.trim()) redirectParams.append('package', packageType.trim());
    // Include all person details for family package
    if (person1Name && person1Name.trim()) redirectParams.append('person1Name', person1Name.trim());
    if (person1Dob && person1Dob.trim()) redirectParams.append('person1Dob', person1Dob.trim());
    if (person2Name && person2Name.trim()) redirectParams.append('person2Name', person2Name.trim());
    if (person2Dob && person2Dob.trim()) redirectParams.append('person2Dob', person2Dob.trim());
    if (person3Name && person3Name.trim()) redirectParams.append('person3Name', person3Name.trim());
    if (person3Dob && person3Dob.trim()) redirectParams.append('person3Dob', person3Dob.trim());
    
    const redirectUrl = `https://${req.headers.host}/payment-status${redirectParams.toString() ? '?' + redirectParams.toString() : ''}`;

    // Prepare metadata with customer details (PhonePe requires metadata as JSON string)
    const metadataObject = {
      email: email || '',
      name: name || '',
      mobile: mobile || '',
      dob: dob || '',
      packageType: packageType || 'single',
      person1Name: person1Name || '',
      person1Dob: person1Dob || '',
      person2Name: person2Name || '',
      person2Dob: person2Dob || '',
      person3Name: person3Name || '',
      person3Dob: person3Dob || '',
    };

    // 1. Build the Payment Payload
    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: "U" + mobile,
      amount: amount * 100, // Amount in Paise
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      paymentInstrument: { type: "PAY_PAGE" },
      // PhonePe accepts metadata as a JSON string in the payload
      // Note: Some PhonePe versions might use 'metaInfo' instead of 'metadata'
      metadata: JSON.stringify(metadataObject),
      metaInfo: JSON.stringify(metadataObject), // Try both field names
    };

    // 2. Create the Checksum (Digital Signature)
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + "###" + saltIndex;

    // 3. Call PhonePe API
   // const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
    const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const result = await response.json();
    
    // Send the response back to your React app
    return res.status(200).json(result);

  } catch (error) {
    console.error("API Error");
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
