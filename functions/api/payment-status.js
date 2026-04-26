import handler from '../../api/payment-status.js';
import { toCF } from '../_adapter.js';
export const onRequest = toCF(handler);