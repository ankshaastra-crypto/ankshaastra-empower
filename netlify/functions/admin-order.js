import handler from '../../api/admin/order.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
