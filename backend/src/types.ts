import { z } from "zod";

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

export type UrgencyType = (typeof Urgency)[keyof typeof Urgency];

// Payout Methods
export const PayoutMethod = {
  CASH: "CASH",
  MOMO: "MOMO",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;

export type PayoutMethodType = (typeof PayoutMethod)[keyof typeof PayoutMethod];

// Zod Schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const createCashRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  purpose: z.string().min(3, "Purpose must be at least 3 characters"),
  categoryId: z.string().min(1, "Category is required"),
  client: z.string().optional(),
  site: z.string().optional(),

  payoutMethod: z.enum(["CASH", "MOMO", "BANK_TRANSFER"]),

  // Conditional validation logic should handle these, but for schema we make them optional string
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),

  description: z.string().optional(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  neededBy: z.coerce.date().optional(),
}).refine((data) => {
  if (data.payoutMethod === "MOMO") {
    return !!data.accountNumber && !!data.bankName; // bankName used as provider
  }
  if (data.payoutMethod === "BANK_TRANSFER") {
    return !!data.accountNumber && !!data.bankName && !!data.accountName;
  }
  return true;
}, {
  message: "Missing required account details for selected payout method",
  path: ["payoutMethod"],
});

export type CreateCashRequestInput = z.infer<typeof createCashRequestSchema>;

export const reviewCashRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export type ReviewCashRequestInput = z.infer<typeof reviewCashRequestSchema>;

export const updateCashRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  purpose: z.string().min(3, "Purpose must be at least 3 characters").optional(),
});

export type UpdateCashRequestInput = z.infer<typeof updateCashRequestSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(["STAFF", "ADMIN", "MANAGER"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

// Response types
export interface CategoryResponse {
  id: string;
  name: string;
  active: boolean;
}

export interface CashRequestResponse {
  id: string;
  requestNumber: string;
  amount: number;
  purpose: string;

  categoryId: string;
  category: CategoryResponse;

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
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  pendingAmount: number;
}
