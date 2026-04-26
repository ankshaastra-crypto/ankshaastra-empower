import handler from '../../api/health.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
