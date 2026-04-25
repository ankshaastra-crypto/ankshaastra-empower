import handler from '../../api/whatsapp-webhook.js';
import { toNetlify } from './_adapter.js';
export const handler = toNetlify(handler);
