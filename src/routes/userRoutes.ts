import { Router } from "express";
import { getPublicProfile } from "../controllers/userController";

const router = Router();

router.get("/:id/profile", getPublicProfile);

export default router;
