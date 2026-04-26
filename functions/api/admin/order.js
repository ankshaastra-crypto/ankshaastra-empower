import handler from '../../../api/admin/order.js';
import { toCF } from '../../_adapter.js';
export const onRequest = toCF(handler);