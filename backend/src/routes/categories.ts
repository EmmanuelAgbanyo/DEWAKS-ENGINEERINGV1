import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { createCategorySchema, UserRole } from "../types";

type Variables = {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
};

export const categoryRouter = new Hono<{ Variables: Variables }>();

// GET /api/categories - List all categories
categoryRouter.get("/", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const categories = await prisma.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
    });

    return c.json({ data: categories });
});

// POST /api/categories - Create category (Admin only)
categoryRouter.post(
    "/",
    zValidator("json", createCategorySchema),
    async (c) => {
        const user = c.get("user");
        if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || (dbUser.role !== UserRole.ADMIN && dbUser.role !== UserRole.MANAGER)) {
            return c.json({ error: { message: "Only admin/manager can create categories" } }, 403);
        }

        const { name } = c.req.valid("json");

        const category = await prisma.category.create({
            data: { name },
        });

        return c.json({ data: category }, 201);
    }
);
