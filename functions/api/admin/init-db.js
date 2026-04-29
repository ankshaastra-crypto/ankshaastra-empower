import { toCF } from '../../_adapter.js';

export const onRequest = toCF(async (req, res) => {
  res.status(501).json({ 
    success: false, 
    error: "Not Implemented", 
    message: "init-db handler needs implementation using _utils/db-unified.js" 
  });
});
