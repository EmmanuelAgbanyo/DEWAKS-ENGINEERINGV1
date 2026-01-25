import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import {
  createCashRequestSchema,
  updateCashRequestSchema,
  reviewCashRequestSchema,
  CashRequestStatus,
  UserRole,
} from "../types";
import {
  notifyNewRequest,
  notifyAdminReview,
  notifyManagerReview,
} from "../notifications";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const cashRequestRouter = new Hono<{ Variables: Variables }>();

// Generate request number
function generateRequestNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CR${year}${month}-${random}`;
}

// GET /api/cash-requests - List requests based on user role
cashRequestRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return c.json({ error: { message: "User not found" } }, 404);

  let where = {};

  if (dbUser.role === UserRole.STAFF) {
    // Staff sees only their requests
    where = { requesterId: user.id };
  } else if (dbUser.role === UserRole.ADMIN) {
    // Admin sees requests pending their review OR already reviewed by them
    where = {
      OR: [
        { status: CashRequestStatus.PENDING_ADMIN },
        { adminId: user.id },
      ],
    };
  } else if (dbUser.role === UserRole.MANAGER) {
    // Manager sees ALL pending requests (both PENDING_ADMIN and PENDING_MANAGER) plus their reviewed ones
    where = {
      OR: [
        { status: CashRequestStatus.PENDING_ADMIN },
        { status: CashRequestStatus.PENDING_MANAGER },
        { managerId: user.id },
      ],
    };
  }

  const requests = await prisma.cashRequest.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true, email: true, department: true } },
      category: { select: { id: true, name: true, active: true } },
      admin: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: requests });
});

// GET /api/cash-requests/all - List ALL requests (for admin/manager dashboard)
cashRequestRouter.get("/all", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === UserRole.STAFF) {
    return c.json({ error: { message: "Access denied" } }, 403);
  }

  const requests = await prisma.cashRequest.findMany({
    include: {
      requester: { select: { id: true, name: true, email: true, department: true } },
      category: { select: { id: true, name: true, active: true } },
      admin: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: requests });
});

// GET /api/cash-requests/stats - Dashboard statistics
cashRequestRouter.get("/stats", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return c.json({ error: { message: "User not found" } }, 404);

  let where: any = {};
  if (dbUser.role === UserRole.STAFF) {
    where = { requesterId: user.id };
  }

  const [total, pending, approved, rejected, amounts] = await Promise.all([
    prisma.cashRequest.count({ where }),
    prisma.cashRequest.count({
      where: {
        ...where,
        status: { in: [CashRequestStatus.PENDING_ADMIN, CashRequestStatus.PENDING_MANAGER] },
      },
    }),
    prisma.cashRequest.count({
      where: { ...where, status: CashRequestStatus.APPROVED },
    }),
    prisma.cashRequest.count({
      where: {
        ...where,
        status: { in: [CashRequestStatus.REJECTED_BY_ADMIN, CashRequestStatus.REJECTED_BY_MANAGER] },
      },
    }),
    prisma.cashRequest.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  const pendingAmount = await prisma.cashRequest.aggregate({
    where: {
      ...where,
      status: { in: [CashRequestStatus.PENDING_ADMIN, CashRequestStatus.PENDING_MANAGER] },
    },
    _sum: { amount: true },
  });

  return c.json({
    data: {
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      totalAmount: amounts._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
    },
  });
});

// GET /api/cash-requests/:id - Get single request
cashRequestRouter.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const request = await prisma.cashRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, department: true } },
      category: { select: { id: true, name: true, active: true } },
      admin: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!request) {
    return c.json({ error: { message: "Request not found" } }, 404);
  }

  return c.json({ data: request });
});

// POST /api/cash-requests - Create new request (Staff only)
cashRequestRouter.post(
  "/",
  zValidator("json", createCashRequestSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return c.json({ error: { message: "User not found" } }, 404);

    // Only staff can create requests
    if (dbUser.role !== UserRole.STAFF) {
      return c.json({ error: { message: "Only staff can create cash requests" } }, 403);
    }

    const body = c.req.valid("json");

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return c.json({ error: { message: "Invalid category" } }, 400);
    }

    const requestNumber = generateRequestNumber();

    const request = await prisma.cashRequest.create({
      data: {
        requestNumber,
        amount: body.amount,
        purpose: body.purpose,
        categoryId: body.categoryId,
        client: body.client,
        site: body.site,
        payoutMethod: body.payoutMethod,
        accountName: body.accountName,
        accountNumber: body.accountNumber,
        bankName: body.bankName,
        description: body.description,
        urgency: body.urgency,
        neededBy: body.neededBy,
        status: CashRequestStatus.PENDING_ADMIN,
        requesterId: user.id,
      },
      include: {
        requester: { select: { id: true, name: true, email: true, department: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Send notifications
    await notifyNewRequest(
      {
        requestNumber: request.requestNumber,
        amount: request.amount,
        purpose: request.purpose,
        requesterName: request.requester.name,
        status: request.status,
      },
      request.requester.email
    );

    return c.json({ data: request }, 201);
  }
);

// PUT /api/cash-requests/:id - Edit own pending request (Staff only)
cashRequestRouter.put(
  "/:id",
  zValidator("json", updateCashRequestSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const { id } = c.req.param();
    const body = c.req.valid("json");

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return c.json({ error: { message: "User not found" } }, 404);

    // Only staff can edit requests
    if (dbUser.role !== UserRole.STAFF) {
      return c.json({ error: { message: "Only staff can edit cash requests" } }, 403);
    }

    const request = await prisma.cashRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return c.json({ error: { message: "Request not found" } }, 404);
    }

    // Staff can only edit their own requests
    if (request.requesterId !== user.id) {
      return c.json({ error: { message: "You can only edit your own requests" } }, 403);
    }

    // Can only edit if status is PENDING_ADMIN (not yet approved by anyone)
    if (request.status !== CashRequestStatus.PENDING_ADMIN) {
      return c.json({ error: { message: "Can only edit requests that are pending initial review" } }, 400);
    }

    // Build update data with only provided fields
    const updateData: { amount?: number; purpose?: string } = {};
    if (body.amount !== undefined) {
      updateData.amount = body.amount;
    }
    if (body.purpose !== undefined) {
      updateData.purpose = body.purpose;
    }

    const updated = await prisma.cashRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: { select: { id: true, name: true, email: true, department: true } },
        category: { select: { id: true, name: true } },
        admin: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    return c.json({ data: updated });
  }
);

// PATCH /api/cash-requests/:id/review - Review request (Admin or Manager)
cashRequestRouter.patch(
  "/:id/review",
  zValidator("json", reviewCashRequestSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const { id } = c.req.param();
    const body = c.req.valid("json");

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return c.json({ error: { message: "User not found" } }, 404);

    const request = await prisma.cashRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    if (!request) {
      return c.json({ error: { message: "Request not found" } }, 404);
    }

    let updateData: any = {};

    // Admin review
    if (dbUser.role === UserRole.ADMIN) {
      if (request.status !== CashRequestStatus.PENDING_ADMIN) {
        return c.json({ error: { message: "Request is not pending admin review" } }, 400);
      }

      if (body.action === "approve") {
        updateData = {
          status: CashRequestStatus.PENDING_MANAGER,
          adminId: user.id,
          adminComment: body.comment,
          adminReviewedAt: new Date(),
        };
      } else {
        updateData = {
          status: CashRequestStatus.REJECTED_BY_ADMIN,
          adminId: user.id,
          adminComment: body.comment,
          adminReviewedAt: new Date(),
        };
      }
    }
    // Manager review
    else if (dbUser.role === UserRole.MANAGER) {
      // Manager can review PENDING_ADMIN (skip admin step) or PENDING_MANAGER
      if (request.status === CashRequestStatus.PENDING_ADMIN) {
        // Manager reviewing directly - skip admin step
        if (body.action === "approve") {
          updateData = {
            status: CashRequestStatus.APPROVED,
            adminId: user.id,
            adminComment: "Approved directly by Manager",
            adminReviewedAt: new Date(),
            managerId: user.id,
            managerComment: body.comment,
            managerReviewedAt: new Date(),
          };
        } else {
          updateData = {
            status: CashRequestStatus.REJECTED_BY_MANAGER,
            managerId: user.id,
            managerComment: body.comment,
            managerReviewedAt: new Date(),
          };
        }
      } else if (request.status === CashRequestStatus.PENDING_MANAGER) {
        if (body.action === "approve") {
          updateData = {
            status: CashRequestStatus.APPROVED,
            managerId: user.id,
            managerComment: body.comment,
            managerReviewedAt: new Date(),
          };
        } else {
          updateData = {
            status: CashRequestStatus.REJECTED_BY_MANAGER,
            managerId: user.id,
            managerComment: body.comment,
            managerReviewedAt: new Date(),
          };
        }
      } else {
        return c.json({ error: { message: "Request is not pending review" } }, 400);
      }
    } else {
      return c.json({ error: { message: "Only Admin or Manager can review requests" } }, 403);
    }

    const updated = await prisma.cashRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: { select: { id: true, name: true, email: true, department: true } },
        category: { select: { id: true, name: true } },
        admin: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    // Send notifications
    const notificationData = {
      requestNumber: updated.requestNumber,
      amount: updated.amount,
      purpose: updated.purpose,
      requesterName: updated.requester.name,
      status: updated.status,
      reviewerName: dbUser.name,
      comment: body.comment,
    };

    if (dbUser.role === UserRole.ADMIN) {
      await notifyAdminReview(notificationData, updated.requester.email, body.action === "approve");
    } else {
      await notifyManagerReview(notificationData, updated.requester.email, body.action === "approve");
    }

    return c.json({ data: updated });
  }
);

// DELETE /api/cash-requests/reset-all - Delete all cash requests (Admin or Manager only)
cashRequestRouter.delete("/reset-all", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return c.json({ error: { message: "User not found" } }, 404);

  // Only ADMIN or MANAGER can reset all requests
  if (dbUser.role !== UserRole.ADMIN && dbUser.role !== UserRole.MANAGER) {
    return c.json({ error: { message: "Only Admin or Manager can reset all cash requests" } }, 403);
  }

  const result = await prisma.cashRequest.deleteMany({});

  return c.json({
    data: {
      message: "All cash requests have been deleted",
      deletedCount: result.count,
    },
  });
});
