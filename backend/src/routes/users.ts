import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { updateUserRoleSchema, UserRole } from "../types";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const usersRouter = new Hono<{ Variables: Variables }>();

// GET /api/users/me - Get current user with role
usersRouter.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      department: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return c.json({ error: { message: "User not found" } }, 404);
  }

  // Optional: Enforce active check here too, though middleware is better
  if (!dbUser.active && dbUser.role === UserRole.STAFF) {
    // We return the user but frontend should block access or show "Pending"
  }

  return c.json({ data: dbUser });
});

// GET /api/users - List all users (Admin/Manager only)
usersRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === UserRole.STAFF) {
    return c.json({ error: { message: "Access denied" } }, 403);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      department: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: users });
});

// PATCH /api/users/:id/role - Update user role (Manager only)
usersRouter.patch(
  "/:id/role",
  zValidator("json", updateUserRoleSchema),
  async (c) => {
    const currentUser = c.get("user");
    if (!currentUser) return c.json({ error: { message: "Unauthorized" } }, 401);

    const dbCurrentUser = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!dbCurrentUser || dbCurrentUser.role !== UserRole.MANAGER) {
      return c.json({ error: { message: "Only managers can change user roles" } }, 403);
    }

    const { id } = c.req.param();
    const { role } = c.req.valid("json");

    // Cannot change own role
    if (id === currentUser.id) {
      return c.json({ error: { message: "Cannot change your own role" } }, 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        department: true,
        createdAt: true,
      },
    });

    return c.json({ data: updated });
  }
);

// PATCH /api/users/:id/approve - Activate user (Admin/Manager)
usersRouter.patch("/:id/approve", async (c) => {
  const currentUser = c.get("user");
  if (!currentUser) return c.json({ error: { message: "Unauthorized" } }, 401);

  const dbCurrentUser = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!dbCurrentUser || dbCurrentUser.role === UserRole.STAFF) {
    return c.json({ error: { message: "Access denied" } }, 403);
  }

  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const active = body.active !== undefined ? body.active : true;

  const updated = await prisma.user.update({
    where: { id },
    data: { active },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true, // Return new status
    }
  });

  return c.json({ data: updated });
});

// PATCH /api/users/me/profile - Update own profile
usersRouter.patch("/me/profile", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json();
  const { name, department } = body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name && { name }),
      ...(department !== undefined && { department }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      department: true,
      createdAt: true,
    },
  });

  return c.json({ data: updated });
});
// POST /api/users/me/change-email - Change email with password verification
usersRouter.post("/me/change-email", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json();
  const { newEmail, password } = body;

  if (!newEmail || !password) {
    return c.json({ error: { message: "Email and password are required" } }, 400);
  }

  // 1. Verify current password by attempting to sign in
  // We use the current email and the provided password
  try {
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: user.email,
        password: password,
      },
      headers: c.req.raw.headers, // Pass headers to maintain IP/UserAgent context if needed
    });

    if (!signInResponse) {
      return c.json({ error: { message: "Incorrect password" } }, 401);
    }
  } catch (error) {
    return c.json({ error: { message: "Incorrect password" } }, 401);
  }

  // 2. Check if new email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (existingUser) {
    return c.json({ error: { message: "Email is already in use" } }, 400);
  }

  // 3. Update email directly
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: newEmail,
      emailVerified: true, // Auto-verify since they authenticated with password
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return c.json({ data: updated });
});
