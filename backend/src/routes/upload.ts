import { Hono } from "hono";
import { auth } from "../auth";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

type Variables = {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
};

export const uploadRouter = new Hono<{ Variables: Variables }>();

// POST /api/upload - Upload file
uploadRouter.post("/", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
        return c.json({ error: { message: "No file uploaded or invalid file" } }, 400);
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
        return c.json({ error: { message: "Only image files are allowed" } }, 400);
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return c.json({ error: { message: "File size must be less than 5MB" } }, 400);
    }

    try {
        const uploadsDir = join(process.cwd(), "uploads");

        // Ensure uploads directory exists
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const extension = file.name.split(".").pop();
        const filename = `user_${user.id}_${timestamp}.${extension}`;
        const filepath = join(uploadsDir, filename);

        const buffer = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(buffer));

        // Return the URL
        const url = `/uploads/${filename}`;
        return c.json({ data: { url } });
    } catch (error) {
        console.error("Upload error:", error);
        return c.json({ error: { message: "Failed to upload file" } }, 500);
    }
});
