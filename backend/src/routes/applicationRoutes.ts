import { Router } from "express";
import {
  createApplication,
  getApplications,
  getApplicationById,
  verifyApplication,
  approveApplication,
  getApplicationStats,
  getUserApplications,
  updateApplication,
} from "../controllers/applicationController";
import {
  authenticate,
  customerOnly,
  verifierOrAbove,
  adminOrAbove,
  canAccessApplication,
} from "../middleware/auth";
import { validateRequest } from "../utils/validation";
import {
  createApplicationSchema,
  verifyApplicationSchema,
  approveApplicationSchema,
  applicationQuerySchema,
  mongoIdSchema,
} from "../utils/validation";
import { applicationLimiter } from "../middleware/rateLimiter";

const router = Router();


router.use(authenticate);


router.post(
  "/",
  customerOnly,
  applicationLimiter,
  validateRequest(createApplicationSchema),
  createApplication
);

router.put(
  "/:id",
  customerOnly,
  validateRequest(mongoIdSchema),
  updateApplication
);


router.get("/", validateRequest(applicationQuerySchema), getApplications);

router.get("/:id", canAccessApplication, getApplicationById);


router.put(
  "/:applicationId/verify",
  verifierOrAbove,
  validateRequest(verifyApplicationSchema),
  verifyApplication
);


router.put(
  "/:applicationId/approve",
  adminOrAbove,
  validateRequest(approveApplicationSchema),
  approveApplication
);

router.get("/stats/overview", adminOrAbove, getApplicationStats);

router.get("/user/:userId", adminOrAbove, getUserApplications);

export default router;
