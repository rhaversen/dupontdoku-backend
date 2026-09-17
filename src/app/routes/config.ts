import { Router } from "express";
import { getConfig, patchConfig } from "../controllers/configController.js";
import { isAuth } from "../middleware/authorization.js";

const router = Router();

router.get("/", getConfig);
router.patch("/", isAuth, patchConfig);

export default router;
