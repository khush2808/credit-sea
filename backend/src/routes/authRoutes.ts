import { Router } from "express";
import {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  createUser,
  deactivateUser,
  reactivateUser,
} from "../controllers/authController";
import { authenticate, adminOrAbove, superAdminOnly } from "../middleware/auth";
import { validateRequest } from "../utils/validation";
import {
  signupSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
  createUserSchema,
} from "../utils/validation";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();


router.post("/signup", authLimiter, validateRequest(signupSchema), signup);
router.post("/login", authLimiter, validateRequest(loginSchema), login);


router.use(authenticate); 


router.get("/profile", getProfile);
router.put("/profile", validateRequest(updateUserSchema), updateProfile);
router.put(
  "/change-password",
  validateRequest(changePasswordSchema),
  changePassword
);


router.post(
  "/users",
  adminOrAbove,
  validateRequest(createUserSchema),
  createUser
);
router.put("/users/:userId/deactivate", adminOrAbove, deactivateUser);
router.put("/users/:userId/activate", adminOrAbove, reactivateUser);

export default router;
