import { Router } from "express";
import {
  getAllItems,
  getItemById,
  getNewItems,
  getNearbyItems,
  getRecommendedItems,
  getItemsByCategory,
} from "../controllers/itemController.js";
import { getForYou } from "../controllers/forYouController.js";

const router = Router();

router.get("/", getAllItems);
router.get("/new", getNewItems);
router.get("/nearby", getNearbyItems);
router.get("/recommended/:userId", getRecommendedItems);
router.get("/category/:category", getItemsByCategory);
router.get("/for-you/:userId", getForYou);

router.get("/:id", getItemById);

export default router;
