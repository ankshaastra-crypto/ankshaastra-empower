import handler from '../../../api/admin/verify-order.js';
import { toCF } from '../../_adapter.js';
export const onRequest = toCF(handler);