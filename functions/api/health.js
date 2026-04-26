import handler from '../../api/health.js';
import { toCF } from '../_adapter.js';
export const onRequest = toCF(handler);