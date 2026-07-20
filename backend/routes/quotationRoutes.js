const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const controller = require("../controllers/quotationController");

const router = express.Router();

router.get("/", protect, allowRoles("admin", "manager", "sales_executive", "dealer"), controller.listQuotations);
router.get("/:id", protect, allowRoles("admin", "manager", "sales_executive", "dealer"), controller.getQuotation);
router.post("/", protect, allowRoles("admin", "manager", "sales_executive"), controller.createQuotation);
router.put("/:id", protect, allowRoles("admin", "manager", "sales_executive"), controller.updateQuotation);
router.post("/:id/submit", protect, allowRoles("admin", "manager", "sales_executive"), controller.submitQuotation);
router.post("/:id/approve", protect, allowRoles("admin", "manager"), controller.approveQuotation);
router.post("/:id/reject", protect, allowRoles("admin", "manager"), controller.rejectQuotation);
router.post("/:id/send", protect, allowRoles("admin", "manager", "sales_executive"), controller.sendQuotation);
router.post("/:id/accept", protect, allowRoles("dealer"), controller.acceptQuotation);
router.post("/:id/decline", protect, allowRoles("dealer"), controller.declineQuotation);
router.post("/:id/cancel", protect, allowRoles("admin", "manager", "sales_executive"), controller.cancelQuotation);
router.post("/:id/duplicate", protect, allowRoles("admin", "manager", "sales_executive"), controller.duplicateQuotation);
router.get("/:id/history", protect, allowRoles("admin", "manager", "sales_executive", "dealer"), controller.getQuotationHistory);
router.get("/:id/pdf", protect, allowRoles("admin", "manager", "sales_executive", "dealer"), controller.pdfNotReady);

module.exports = router;
