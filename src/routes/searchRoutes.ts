import { Router } from "express";
import { semanticSearch } from "../controllers/searchController.js";

const router = Router();

router.get("/", semanticSearch);

export default router;
