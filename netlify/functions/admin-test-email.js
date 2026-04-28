import handler from '../../api/admin/test-email.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
