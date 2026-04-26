import handler from '../../api/whatsapp-webhook.js';
import { toCF } from '../_adapter.js';
export const onRequest = toCF(handler);