import { useMemo, useState } from "react";
import { EditIcon, EyeIcon } from "../../../components/dashboard/dashboardIcons";
import styles from "../QuotationManagement.module.css";

export default function QuotationActionsMenu({ quotation, userRole, onView, onAction }) {
  const [open, setOpen] = useState(false);

  const actions = useMemo(() => {
    const items = [{ id: "duplicate", label: "Duplicate" }];

    if (["admin", "manager"].includes(userRole) || (userRole === "sales_executive" && quotation.status === "draft")) {
      items.unshift({ id: "edit", label: "Edit" });
    }

    if (quotation.status === "draft") items.push({ id: "submit", label: "Submit" });
    if (quotation.status === "pending_approval" && ["admin", "manager"].includes(userRole)) {
      items.push({ id: "approve", label: "Approve" }, { id: "reject", label: "Reject" });
    }
    if (quotation.status === "approved") items.push({ id: "send", label: "Send" });
    if (quotation.status === "sent" && userRole === "dealer") {
      items.push({ id: "accept", label: "Accept" }, { id: "decline", label: "Decline" });
    }
    if (["approved", "accepted", "sent"].includes(quotation.status) && ["admin", "manager"].includes(userRole)) {
      items.push({ id: "convert", label: "Convert to Order" });
    }
    if (!["converted", "rejected", "expired", "cancelled"].includes(quotation.status)) {
      items.push({ id: "cancel", label: "Cancel" });
    }

    return items;
  }, [quotation.status, userRole]);

  return (
    <div className={styles.actionMenuWrap}>
      <button type="button" className={styles.actionButton} onClick={() => onView(quotation)} title="View quotation">
        <EyeIcon className={styles.actionIcon} />
        <span>View</span>
      </button>
      <button type="button" className={styles.iconButton} onClick={() => onAction("edit", quotation)} title="Edit quotation">
        <EditIcon className={styles.actionIcon} />
      </button>
      <button type="button" className={styles.iconButton} onClick={() => setOpen((current) => !current)} title="More actions">
        <span className={styles.moreDots}>•••</span>
      </button>
      {open ? (
        <div className={styles.actionDropdown}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles.dropdownAction}
              onClick={() => {
                setOpen(false);
                onAction(action.id, quotation);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
