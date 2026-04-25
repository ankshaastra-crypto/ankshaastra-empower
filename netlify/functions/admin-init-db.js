import handler from '../../api/admin/init-db.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
