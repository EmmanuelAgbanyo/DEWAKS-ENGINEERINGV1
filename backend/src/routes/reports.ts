
import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { UserRole } from "../types";

type Variables = {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
};

export const reportsRouter = new Hono<{ Variables: Variables }>();

// GET /api/reports/export - Export requests to CSV
reportsRouter.get("/export", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.role === UserRole.STAFF) {
        return c.json({ error: { message: "Access denied" } }, 403);
    }

    // Fetch all requests with full details
    const requests = await prisma.cashRequest.findMany({
        include: {
            requester: { select: { name: true, email: true, department: true } },
            category: { select: { name: true } },
            admin: { select: { name: true } },
            manager: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Generate CSV manually (simple enough without extra libs)
    const headers = [
        "Request ID",
        "Date",
        "Requester",
        "Department",
        "Amount (GHS)",
        "Category",
        "Purpose",
        "Status",
        "Payout Method",
        "Payee Name",
        "Payee Number",
        "Bank/Provider",
        "Urgency",
        "Needed By",
        "Admin Reviewer",
        "Manager Reviewer"
    ];

    const rows = requests.map(r => [
        r.requestNumber,
        r.createdAt.toISOString().split('T')[0],
        `"${r.requester.name}"`,
        `"${r.requester.department || ''}"`,
        r.amount.toFixed(2),
        `"${r.category.name}"`,
        `"${r.purpose.replace(/"/g, '""')}"`, // Escape quotes
        r.status,
        r.payoutMethod,
        `"${r.accountName || ''}"`,
        `"${r.accountNumber || ''}"`,
        `"${r.bankName || ''}"`,
        r.urgency,
        r.neededBy ? r.neededBy.toISOString().split('T')[0] : '',
        `"${r.admin?.name || ''}"`,
        `"${r.manager?.name || ''}"`
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename="cash_requests_export_${new Date().toISOString().split('T')[0]}.csv"`);

    return c.body(csvContent);
});

// GET /api/reports/advanced-stats - Category breakdown
reportsRouter.get("/advanced-stats", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.role === UserRole.STAFF) {
        return c.json({ error: { message: "Access denied" } }, 403);
    }

    // 1. Spend by Category
    const byCategory = await prisma.cashRequest.groupBy({
        by: ['categoryId'],
        where: { status: 'APPROVED' },
        _sum: { amount: true },
        _count: { id: true },
    });

    // Resolve category names
    const categories = await prisma.category.findMany();
    const categoryStats = byCategory.map(stat => ({
        name: categories.find(c => c.id === stat.categoryId)?.name || 'Unknown',
        amount: stat._sum.amount || 0,
        count: stat._count.id
    })).sort((a, b) => b.amount - a.amount); // Sort desc by spend

    // 2. Spend by Payout Method
    const byMethod = await prisma.cashRequest.groupBy({
        by: ['payoutMethod'],
        where: { status: 'APPROVED' },
        _sum: { amount: true },
        _count: { id: true },
    });

    const methodStats = byMethod.map(stat => ({
        method: stat.payoutMethod,
        amount: stat._sum.amount || 0,
        count: stat._count.id
    }));

    return c.json({
        data: {
            byCategory: categoryStats,
            byMethod: methodStats
        }
    });

});

// GET /api/reports/trends - Daily spending trend (Last 30 days)
reportsRouter.get("/trends", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.role === UserRole.STAFF) {
        return c.json({ error: { message: "Access denied" } }, 403);
    }

    // Get requests from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const requests = await prisma.cashRequest.findMany({
        where: {
            status: 'APPROVED',
            updatedAt: { gte: thirtyDaysAgo }
        },
        select: {
            amount: true,
            updatedAt: true
        },
        orderBy: { updatedAt: 'asc' }
    });

    // Group by date
    const grouped = requests.reduce<Record<string, number>>((acc, curr) => {
        const date = curr.updatedAt.toISOString().split('T')[0] as string;
        acc[date] = (acc[date] || 0) + curr.amount;
        return acc;
    }, {});

    // Fill missing days
    const trend = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0] as string;
        trend.unshift({
            date: dateStr,
            amount: grouped[dateStr] || 0
        });
    }

    return c.json({ data: trend });
});
