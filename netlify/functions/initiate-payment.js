import handler from '../../api/initiate-payment.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
