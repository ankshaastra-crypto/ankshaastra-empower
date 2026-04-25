import handler from '../../api/payment-webhook.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
