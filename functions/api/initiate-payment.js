import handler from '../../api/initiate-payment.js';
import { toCF } from '../_adapter.js';
export const onRequest = toCF(handler);