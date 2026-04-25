import handler from '../../api/payment-status.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
