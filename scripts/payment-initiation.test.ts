import { test, expect, mock } from 'bun:test';

let saves: unknown[][] = [];
let persisted = false;
let cacheCalls = 0;
mock.module('../server/_utils/db.js', () => ({ saveOrderAndCustomer: async (...args: unknown[]) => {
  saves.push(args);
  await new Promise(resolve => setTimeout(resolve, 20));
  persisted = true;
  return true;
} }));
mock.module('../server/_utils/encryption.js', () => ({ encryptCustomerData: () => 'synthetic-encrypted-data' }));
mock.module('../server/_utils/rate-limiter.js', () => ({ rateLimiter: async () => {} }));
mock.module('../server/_utils/redis-cache.js', () => ({ getRedisCache: () => { cacheCalls++; return {set: async () => true};} }));
const {default: handler} = await import('../server/handlers/initiate-payment.js');

test('save the complete Name Check order exactly once before responding, without unconfigured cache waits', async () => {
  const originalFetch = globalThis.fetch;
  const previous = {key: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET, redis: process.env.REDIS_URL};
  process.env.RAZORPAY_KEY_ID = 'synthetic-test-key';
  process.env.RAZORPAY_KEY_SECRET = 'synthetic-test-secret';
  delete process.env.REDIS_URL;
  globalThis.fetch = mock(async () => new Response(JSON.stringify({id:'synthetic-gateway-order'}), {status:200})) as typeof fetch;
  saves = []; persisted = false; cacheCalls = 0;
  try {
    let status = 0;
    const res = {headersSent:false, status: (code: number) => {status=code; return res;}, json: (data: any) => {
      expect(persisted).toBe(true);
      expect(data.razorpayOrderId).toBe('synthetic-gateway-order');
    }};
    await handler({method:'POST', body:{amount:473, mobile:'9999999999', orderId:'synthetic-order', email:'test@example.test', name:'Test Name', packageType:'name-check', person1FirstName:'Test', person1SurName:'Name', person1Dob:'2000-01-02', fatherFullName:'Test Parent'}}, res);
    expect(status).toBe(200);
    expect(saves.length).toBe(1);
    expect(saves[0]?.[2]).toBe('name-check');
    expect(saves[0]?.[3]).toMatchObject({razorpayOrderId:'synthetic-gateway-order', person1Dob:'2000-01-02', fatherFullName:'Test Parent'});
    expect(cacheCalls).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries({RAZORPAY_KEY_ID:previous.key, RAZORPAY_KEY_SECRET:previous.secret, REDIS_URL:previous.redis})) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});