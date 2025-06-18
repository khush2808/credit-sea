import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUserRole,
  toggleUserStatus,
  getUserActivity,
  resetUserPassword,
} from "../controllers/adminController";
import { authenticate, adminOrAbove, superAdminOnly } from "../middleware/auth";
import { validateRequest } from "../utils/validation";
import {
  createUserSchema,
  updateUserRoleSchema,
  toggleUserStatusSchema,
  resetPasswordSchema,
  userQuerySchema,
  mongoIdSchema,
} from "../utils/validation";

const router = Router();


router.use(authenticate);
router.use(adminOrAbove);


router.get("/users", validateRequest(userQuerySchema), getAllUsers);

router.get("/users/:id", validateRequest(mongoIdSchema), getUserById);

router.post("/users", validateRequest(createUserSchema), createUser);

router.put(
  "/users/:id/role",
  validateRequest(updateUserRoleSchema),
  updateUserRole
);

router.put(
  "/users/:id/status",
  validateRequest(toggleUserStatusSchema),
  toggleUserStatus
);

router.get(
  "/users/:id/activity",
  validateRequest(mongoIdSchema),
  getUserActivity
);

router.put(
  "/users/:id/reset-password",
  validateRequest(resetPasswordSchema),
  resetUserPassword
);

export default router;
