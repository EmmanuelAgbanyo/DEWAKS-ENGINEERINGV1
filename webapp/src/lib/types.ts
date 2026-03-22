// User roles
export const UserRole = {
  STAFF: "STAFF",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// Cash request status
export const CashRequestStatus = {
  PENDING_ADMIN: "PENDING_ADMIN",
  PENDING_MANAGER: "PENDING_MANAGER",
  APPROVED: "APPROVED",
  DISBURSED: "DISBURSED",
  REJECTED_BY_ADMIN: "REJECTED_BY_ADMIN",
  REJECTED_BY_MANAGER: "REJECTED_BY_MANAGER",
} as const;

export type CashRequestStatusType = (typeof CashRequestStatus)[keyof typeof CashRequestStatus];

// Urgency levels
export const Urgency = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

// Payout Methods
export const PayoutMethod = {
  CASH: "CASH",
  MOMO: "MOMO",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;

export type PayoutMethodType = (typeof PayoutMethod)[keyof typeof PayoutMethod];

export interface Category {
  id: string;
  name: string;
  active: boolean;
}

// Response types
export interface CashRequest {
  id: string;
  requestNumber: string;
  amount: number;
  purpose: string;

  categoryId: string;
  category: Category;

  client: string | null;
  site: string | null;
  payoutMethod: string;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;

  description: string | null;
  urgency: string;
  neededBy: string | null;
  status: string;
  requester: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  admin: {
    id: string;
    name: string;
    email: string;
  } | null;
  adminComment: string | null;
  adminReviewedAt: string | null;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
  managerComment: string | null;
  managerReviewedAt: string | null;
  disbursed: {
    id: string;
    name: string;
    email: string;
  } | null;
  disbursedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  department?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  disbursedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  pendingAmount: number;
  disbursedAmount: number;
}

// Status display helpers
export const statusLabels: Record<string, string> = {
  PENDING_ADMIN: "Pending Admin Review",
  PENDING_MANAGER: "Pending Manager Approval",
  APPROVED: "Approved",
  DISBURSED: "Disbursed",
  REJECTED_BY_ADMIN: "Rejected by Admin",
  REJECTED_BY_MANAGER: "Rejected by Manager",
};

export const statusColors: Record<string, string> = {
  PENDING_ADMIN: "badge-pending",
  PENDING_MANAGER: "badge-pending",
  APPROVED: "badge-approved",
  DISBURSED: "badge-disbursed",
  REJECTED_BY_ADMIN: "badge-rejected",
  REJECTED_BY_MANAGER: "badge-rejected",
};

export const urgencyColors: Record<string, string> = {
  LOW: "text-slate-400",
  NORMAL: "text-blue-400",
  HIGH: "text-amber-400",
  URGENT: "text-red-400",
};
