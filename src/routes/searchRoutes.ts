import { Router } from "express";
import { semanticSearch } from "../controllers/searchController";
import requireAuth from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", semanticSearch);

export default router;

