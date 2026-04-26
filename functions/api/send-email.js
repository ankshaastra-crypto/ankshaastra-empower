export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers
    });
  }

  try {
    const body = await request.json();
    const { name, email, payment_id } = body;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: email,
        subject: "Payment Successful",
        html: `
          <h2>Payment Successful</h2>
          <p>Hi ${name || "User"},</p>
          <p>Your payment has been successfully received.</p>
          <p><strong>Payment ID:</strong> ${payment_id}</p>
          <br/>
          <p>Thank you!</p>
        `
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers
    });
  }
}