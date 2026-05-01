export async function onRequest() {
  return new Response(JSON.stringify({
    success: true,
    message: 'WhatsApp webhook endpoint is active',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
