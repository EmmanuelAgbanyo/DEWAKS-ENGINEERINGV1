import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";

type Variables = {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
};

export const commentsRouter = new Hono<{ Variables: Variables }>();

const createCommentSchema = z.object({
    comment: z.string().min(1, "Comment cannot be empty"),
});

// POST /api/comments - Create a new comment
commentsRouter.post(
    "/",
    zValidator("json", createCommentSchema),
    async (c) => {
        // Optionally check auth? User didn't specify. Assuming public or logged in.
        // Let's allow public for now as per the "simple form" request, 
        // but the app seems to use auth. 
        // If I enforce auth, I might block them.
        // I'll leave auth check optional or just log who did it if logged in.

        // const user = c.get("user");

        const { comment } = c.req.valid("json");

        try {
            const newComment = await prisma.comment.create({
                data: {
                    comment,
                },
            });
            return c.json(newComment, 201);
        } catch (e) {
            console.error(e);
            return c.json({ error: "Failed to create comment" }, 500);
        }
    }
);
