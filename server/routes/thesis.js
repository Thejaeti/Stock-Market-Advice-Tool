import { Router } from 'express';
import { THESIS_TIERS, THESIS_SUMMARY } from '../mock/thesisMetadata.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    summary: THESIS_SUMMARY,
    tiers: THESIS_TIERS,
  });
});

export default router;
