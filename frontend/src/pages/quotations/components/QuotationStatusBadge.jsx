import styles from "../QuotationManagement.module.css";

const statusLabelMap = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
  converted: "Converted"
};

export default function QuotationStatusBadge({ status }) {
  const toneClass =
    status === "approved" || status === "accepted" || status === "converted"
      ? styles.statusSuccess
      : status === "pending_approval" || status === "sent" || status === "expired"
        ? styles.statusWarning
        : status === "rejected" || status === "cancelled"
          ? styles.statusDanger
          : styles.statusNeutral;

  return <span className={`${styles.statusBadge} ${toneClass}`}>{statusLabelMap[status] || status}</span>;
}
