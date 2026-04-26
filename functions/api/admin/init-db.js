import handler from '../../../api/admin/init-db.js';
import { toCF } from '../../_adapter.js';
export const onRequest = toCF(handler);