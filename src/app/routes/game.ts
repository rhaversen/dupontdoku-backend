import { Router } from "express";
import {
	startRun,
	getState,
	respond,
	redeem,
	confirm,
	listGuests,
	me,
} from "../controllers/gameController.js";

const router = Router();

router.post("/start", startRun);
router.get("/state", getState);
router.post("/respond", respond);
router.post("/redeem", redeem);
router.post("/confirm", confirm);
router.get("/guests", listGuests);
router.get("/me", me);

export default router;
