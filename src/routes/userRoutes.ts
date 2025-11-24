import { Router } from "express";
import { getPublicProfile, updateMyProfile } from "../controllers/userController";
import requireAuth from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/:id/profile", getPublicProfile);
router.put("/me", updateMyProfile);

export default router;
