const TERMINAL_STATUSES = new Set(["rejected", "expired", "cancelled", "converted"]);

const statusTransitionMap = {
  draft: ["pending_approval", "approved", "cancelled"],
  pending_approval: ["approved", "rejected", "cancelled"],
  approved: ["sent", "cancelled", "converted"],
  sent: ["accepted", "rejected", "expired", "cancelled", "converted"],
  accepted: ["converted", "cancelled"],
  rejected: [],
  expired: [],
  cancelled: [],
  converted: []
};

const canViewQuotation = (user, quotation, dealerId = null) => {
  if (["admin", "manager"].includes(user?.role)) return true;
  if (user?.role === "sales_executive") return quotation.created_by === user.id || quotation.created_by === user._id;
  if (user?.role === "dealer") return dealerId && quotation.dealer_id === dealerId;
  return false;
};

const canEditQuotation = (user, quotation) => {
  if (TERMINAL_STATUSES.has(quotation.status)) return false;
  if (quotation.status === "accepted") return false;
  if (["admin", "manager"].includes(user?.role)) return true;
  return user?.role === "sales_executive" && quotation.status === "draft" && quotation.created_by === (user.id || user._id);
};

const canCreateQuotation = (user) => ["admin", "manager", "sales_executive"].includes(user?.role);

const canApproveQuotation = (user) => ["admin", "manager"].includes(user?.role);

const canDealerRespond = (user, quotation) => user?.role === "dealer" && quotation.status === "sent";

const isValidStatusTransition = (fromStatus, toStatus) =>
  Boolean(statusTransitionMap[fromStatus]?.includes(toStatus));

module.exports = {
  TERMINAL_STATUSES,
  statusTransitionMap,
  canViewQuotation,
  canEditQuotation,
  canCreateQuotation,
  canApproveQuotation,
  canDealerRespond,
  isValidStatusTransition
};
