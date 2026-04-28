import handler from '../../../api/admin/test-email.js';
import { toCF } from '../../_adapter.js';
export const onRequest = toCF(handler);
