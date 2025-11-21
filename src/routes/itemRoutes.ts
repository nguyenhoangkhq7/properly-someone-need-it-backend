import { Router } from "express";
import {
  getAllItems,
  getItemById,
  getNewItems,
  getNearbyItems,
  getRecommendedItems,
} from "../controllers/itemController.js";

const router = Router();

router.get("/", getAllItems);
router.get("/new", getNewItems);
router.get("/nearby", getNearbyItems);
router.get("/recommended/:userId", getRecommendedItems);

router.get("/:id", getItemById);

export default router;
