import { auth } from "./auth";
import { prisma } from "./prisma";

async function main() {
    console.log("Seeding admin directly...");
    const email = "admin@dewaks.com";
    const password = "admin123";
    const name = "Super Admin";

    try {
        // Check if user exists first
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log("User already exists, updating...");
        } else {
            console.log("Creating user...");
            // Use better-auth internal API
            // Note: For internal calls we might need to mock request or use a specific helper
            // But let's try calling the handler directly if exposed, or fall back to client if this fails.
            // Actually, better-auth instance has 'api' which are the handlers.
            // We can pass a mock context?

            // Simpler: Just rely on the fact that we can interact with the DB if we knew the hash.
            // But we don't.

            // Let's try the api call.
            await auth.api.signUpEmail({
                body: { email, password, name }
            });
        }

        // Promote and Activate
        const user = await prisma.user.update({
            where: { email },
            data: {
                role: "MANAGER",
                active: true,
                emailVerified: true
            },
        });

        console.log("User successfully seeded/updated:", user);

    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
