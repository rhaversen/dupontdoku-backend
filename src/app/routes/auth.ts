import { Router } from "express";
import passport from "../utils/passportConfig.js";
import { registerWithInvite, getCurrentUser, logout, listUsers } from "../controllers/authController.js";
import { isAuth } from "../middleware/authorization.js";

const router = Router();

router.post("/register", ...registerWithInvite);
router.post("/login", passport.authenticate("local"), (req, res) => {
	res.json({ id: req.user?.id ?? "", name: req.user?.name ?? "" });
});
router.post("/logout", logout);
router.get("/me", getCurrentUser);
router.get("/users", isAuth, listUsers);

export default router;
