import handler from '../../api/admin/verify-order.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
