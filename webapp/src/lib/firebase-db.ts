import {
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  type DatabaseReference,
  type Unsubscribe,
} from "firebase/database";
import { db } from "./firebase";
import type { DashboardStats } from "./types";

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export interface DBUser {
  name: string;
  email: string;
  role: string;
  department?: string | null;
  active: boolean;
  createdAt: string;
}

/** Write user profile to /users/{uid} on signup */
export async function createUserProfile(uid: string, data: DBUser): Promise<void> {
  await set(ref(db, `users/${uid}`), data);
}

/** Get a single user */
export async function getUser(uid: string): Promise<DBUser | null> {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? (snap.val() as DBUser) : null;
}

/** Subscribe to a user's profile */
export function subscribeToUser(uid: string, callback: (user: DBUser | null) => void): Unsubscribe {
  return onValue(ref(db, `users/${uid}`), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
}

/** Get all users */
export async function getAllUsers(): Promise<Record<string, DBUser>> {
  const snap = await get(ref(db, "users"));
  return snap.exists() ? snap.val() : {};
}

/** Subscribe to all users */
export function subscribeToAllUsers(callback: (users: Record<string, DBUser>) => void): Unsubscribe {
  return onValue(ref(db, "users"), (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
}

/** Update user fields (role, active status, department, etc.) */
export async function updateUser(uid: string, data: Partial<DBUser>): Promise<void> {
  await update(ref(db, `users/${uid}`), data);
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

export interface DBCategory {
  name: string;
  active: boolean;
  createdAt: string;
}

/** Create a category */
export async function createCategory(data: DBCategory): Promise<string> {
  const newRef = push(ref(db, "categories"));
  await set(newRef, data);
  return newRef.key!;
}

/** Get all categories */
export async function getAllCategories(): Promise<Record<string, DBCategory>> {
  const snap = await get(ref(db, "categories"));
  return snap.exists() ? snap.val() : {};
}

/** Subscribe to categories */
export function subscribeToCategories(callback: (cats: Record<string, DBCategory>) => void): Unsubscribe {
  return onValue(ref(db, "categories"), (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
}

/** Update category */
export async function updateCategory(id: string, data: Partial<DBCategory>): Promise<void> {
  await update(ref(db, `categories/${id}`), data);
}

/** Delete category */
export async function deleteCategory(id: string): Promise<void> {
  await remove(ref(db, `categories/${id}`));
}

// ═══════════════════════════════════════════════════════════════
// CASH REQUESTS
// ═══════════════════════════════════════════════════════════════

export interface DBCashRequest {
  requestNumber: string;
  amount: number;
  purpose: string;
  categoryId: string;
  categoryName: string; // Denormalized for read performance
  client?: string | null;
  site?: string | null;
  payoutMethod: string;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  description?: string | null;
  urgency: string;
  neededBy?: string | null;
  status: string;

  // Requester info (denormalized)
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment?: string | null;

  // Admin review
  adminId?: string | null;
  adminName?: string | null;
  adminComment?: string | null;
  adminReviewedAt?: string | null;

  // Manager review
  managerId?: string | null;
  managerName?: string | null;
  managerComment?: string | null;
  managerReviewedAt?: string | null;

  // Disbursement
  disbursedId?: string | null;
  disbursedName?: string | null;
  disbursedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

/** Get the next request number (atomic increment) */
async function getNextRequestNumber(): Promise<string> {
  const counterRef = ref(db, "counters/requestNumber");
  const snap = await get(counterRef);
  const current = snap.exists() ? (snap.val() as number) : 0;
  const next = current + 1;
  await set(counterRef, next);
  return `CR-${String(next).padStart(4, "0")}`;
}

/** Create a new cash request */
export async function createCashRequest(
  data: Omit<DBCashRequest, "requestNumber" | "createdAt" | "updatedAt">
): Promise<string> {
  const requestNumber = await getNextRequestNumber();
  const now = new Date().toISOString();
  const newRef = push(ref(db, "cashRequests"));
  await set(newRef, {
    ...data,
    requestNumber,
    createdAt: now,
    updatedAt: now,
  });
  return newRef.key!;
}

/** Get a single cash request */
export async function getCashRequest(id: string): Promise<DBCashRequest | null> {
  const snap = await get(ref(db, `cashRequests/${id}`));
  return snap.exists() ? (snap.val() as DBCashRequest) : null;
}

/** Subscribe to a single cash request */
export function subscribeToCashRequest(
  id: string,
  callback: (request: DBCashRequest | null) => void
): Unsubscribe {
  return onValue(ref(db, `cashRequests/${id}`), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
}

/** Get all cash requests */
export async function getAllCashRequests(): Promise<Record<string, DBCashRequest>> {
  const snap = await get(ref(db, "cashRequests"));
  return snap.exists() ? snap.val() : {};
}

/** Subscribe to all cash requests (real-time) */
export function subscribeToAllCashRequests(
  callback: (requests: Record<string, DBCashRequest>) => void
): Unsubscribe {
  return onValue(ref(db, "cashRequests"), (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
}

/** Update a cash request (for approvals, rejections, edits) */
export async function updateCashRequest(id: string, data: Partial<DBCashRequest>): Promise<void> {
  await update(ref(db, `cashRequests/${id}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/** Delete a cash request */
export async function deleteCashRequest(id: string): Promise<void> {
  await remove(ref(db, `cashRequests/${id}`));
}

/** Delete all cash requests (admin reset) */
export async function deleteAllCashRequests(): Promise<void> {
  await remove(ref(db, "cashRequests"));
  await set(ref(db, "counters/requestNumber"), 0);
}

// ═══════════════════════════════════════════════════════════════
// INCOMES
// ═══════════════════════════════════════════════════════════════

export interface DBIncome {
  amount: number;
  source: string; // e.g., Sales, Investment, Loan, Internal
  method: string; // e.g., BANK_TRANSFER, MOMO, CASH
  description?: string | null;
  recordedBy: string; // User ID
  recordedByName: string; // denormalized
  createdAt: string;
}

/** Create a new income record */
export async function createIncome(data: Omit<DBIncome, "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const newRef = push(ref(db, "incomes"));
  await set(newRef, {
    ...data,
    createdAt: now,
  });
  return newRef.key!;
}

/** Subscribe to all incomes (real-time) */
export function subscribeToAllIncomes(
  callback: (incomes: Record<string, DBIncome>) => void
): Unsubscribe {
  return onValue(ref(db, "incomes"), (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
}

/** Delete an income record */
export async function deleteIncome(id: string): Promise<void> {
  await remove(ref(db, `incomes/${id}`));
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS (computed from cash requests)
// ═══════════════════════════════════════════════════════════════

/** Subscribe to real-time dashboard stats */
export function subscribeToDashboardStats(
  callback: (stats: DashboardStats) => void,
  userId?: string,
  role?: string
): Unsubscribe {
  return onValue(ref(db, "cashRequests"), (snap) => {
    const data = snap.exists() ? (snap.val() as Record<string, DBCashRequest>) : {};
    const requests = Object.values(data);

    // Filter by user if STAFF role
    const filtered =
      role === "STAFF" && userId
        ? requests.filter((r) => r.requesterId === userId)
        : requests;

    const stats: DashboardStats = {
      totalRequests: filtered.length,
      pendingRequests: filtered.filter(
        (r) => r.status === "PENDING_ADMIN" || r.status === "PENDING_MANAGER"
      ).length,
      approvedRequests: filtered.filter((r) => r.status === "APPROVED").length,
      disbursedRequests: filtered.filter((r) => r.status === "DISBURSED").length,
      rejectedRequests: filtered.filter(
        (r) => r.status === "REJECTED_BY_ADMIN" || r.status === "REJECTED_BY_MANAGER"
      ).length,
      totalAmount: filtered.reduce((sum, r) => sum + r.amount, 0),
      pendingAmount: filtered
        .filter((r) => r.status === "PENDING_ADMIN" || r.status === "PENDING_MANAGER")
        .reduce((sum, r) => sum + r.amount, 0),
      disbursedAmount: filtered
        .filter((r) => r.status === "DISBURSED")
        .reduce((sum, r) => sum + r.amount, 0),
    };

    callback(stats);
  });
}

// ═══════════════════════════════════════════════════════════════
// EXPORT HELPERS
// ═══════════════════════════════════════════════════════════════

/** Convert RTDB record to array with IDs */
export function recordToArray<T>(record: Record<string, T>): (T & { id: string })[] {
  return Object.entries(record).map(([id, data]) => ({ id, ...data }));
}
