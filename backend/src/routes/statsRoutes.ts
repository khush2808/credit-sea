import { Router } from "express";
import {
  getDashboardStats,
  getUserStats,
} from "../controllers/statsController";
import { authenticate, adminOrAbove, superAdminOnly } from "../middleware/auth";

const router = Router();


router.use(authenticate);
router.use(adminOrAbove);


router.get("/dashboard", getDashboardStats);


router.get("/users", getUserStats);

export default router;
