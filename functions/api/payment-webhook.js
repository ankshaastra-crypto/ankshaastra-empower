import handler from '../../api/payment-webhook.js';
import { toCF } from '../_adapter.js';
export const onRequest = toCF(handler);