export const gbp = (n) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(n || 0));

export const STATUS_META = {
  PENDING_ASSESSMENT: { label: "Pending assessment", tone: "mint" },
  AWAITING_CUSTOMER_INFORMATION: { label: "Awaiting your info", tone: "warning" },
  APPROVED: { label: "Approved", tone: "mint" },
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "info" },
  PAID: { label: "Paid", tone: "success" },
  LABEL_GENERATED: { label: "Label ready", tone: "info" },
  AWAITING_SHOES: { label: "Awaiting your shoes", tone: "info" },
  SHOES_IN_TRANSIT: { label: "In transit to us", tone: "info" },
  SHOES_RECEIVED: { label: "Shoes received", tone: "mint" },
  CLEANING: { label: "Cleaning", tone: "mint" },
  QUALITY_CHECK: { label: "Quality check", tone: "mint" },
  READY_FOR_RETURN: { label: "Ready for return", tone: "mint" },
  RETURN_LABEL_GENERATED: { label: "Return label ready", tone: "info" },
  RETURN_IN_TRANSIT: { label: "On its way back", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "danger" },
};

export const PAYMENT_META = {
  UNPAID: { label: "Unpaid", tone: "muted" },
  PAYMENT_PENDING: { label: "Payment pending", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  REFUNDED: { label: "Refunded", tone: "danger" },
  PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "warning" },
};

// Ordered lifecycle for the customer timeline (happy path)
export const CUSTOMER_TIMELINE = [
  "PENDING_ASSESSMENT",
  "APPROVED",
  "PAID",
  "LABEL_GENERATED",
  "AWAITING_SHOES",
  "SHOES_RECEIVED",
  "CLEANING",
  "QUALITY_CHECK",
  "READY_FOR_RETURN",
  "RETURN_IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
];

export const toneClass = (tone) => {
  switch (tone) {
    case "success":
    case "mint":
      return "bg-[rgba(59,130,246,0.16)] text-[#93c5fd] border-[rgba(59,130,246,0.4)]";
    case "info":
      return "bg-[rgba(111,211,255,0.12)] text-[#9fe0ff] border-[rgba(111,211,255,0.3)]";
    case "warning":
      return "bg-[rgba(245,196,81,0.14)] text-[#f5d98a] border-[rgba(245,196,81,0.32)]";
    case "danger":
      return "bg-[rgba(255,90,106,0.14)] text-[#ff9aa4] border-[rgba(255,90,106,0.32)]";
    default:
      return "bg-[rgba(255,255,255,0.05)] text-[#b7c0c7] border-[#2a3238]";
  }
};
