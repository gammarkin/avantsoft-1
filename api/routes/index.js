import { Router } from "express";

import users from "./users.js";
import sales from "./sales.js";
import authenticate from "../middleware/Auth.js";

const router = Router();

router.use('/users', authenticate, users);
router.use('/sales', authenticate, sales);

router.get('/ping', (_, res) => {
  res.send('pong');
});

router.get('/', (_, res) => {
  res.send('HEY!');
});

export default router;
