import { Router } from "express";
import {
  getLoans,
  getLoanById,
  makePayment,
  getLoanTransactions,
  getActiveLoan,
  getLoanStats,
  getOverdueLoans,
  getUpcomingPayments,
  getPaymentSchedule,
} from "../controllers/loanController";
import {
  authenticate,
  customerOnly,
  adminOrAbove,
  canAccessLoan,
} from "../middleware/auth";
import { validateRequest } from "../utils/validation";
import {
  payEMISchema,
  loanQuerySchema,
  mongoIdSchema,
} from "../utils/validation";
import { paymentLimiter } from "../middleware/rateLimiter";

const router = Router();


router.use(authenticate);


router.get("/active", customerOnly, getActiveLoan);

router.post(
  "/payment",
  customerOnly,
  paymentLimiter,
  validateRequest(payEMISchema),
  makePayment
);


router.get("/", validateRequest(loanQuerySchema), getLoans);

router.get("/:id", canAccessLoan, getLoanById);

router.get("/:id/transactions", canAccessLoan, getLoanTransactions);

router.get("/:id/schedule", canAccessLoan, getPaymentSchedule);


router.get("/stats/overview", adminOrAbove, getLoanStats);

router.get("/admin/overdue", adminOrAbove, getOverdueLoans);

router.get("/admin/upcoming-payments", adminOrAbove, getUpcomingPayments);

export default router;
