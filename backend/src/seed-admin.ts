import 'dotenv/config'; // Ensure env vars are loaded
import { auth } from "./auth";
import { prisma } from "./prisma";

async function main() {
    console.log("Starting admin seed...");

    const email = "admin@dewaks.com";
    const password = "admin123";
    const name = "Super Admin";

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("User does not exist, creating...");
        try {
            // Direct API call to better-auth server instance
            // Note: This might require a mock request object depending on adapter
            // But let's try the direct method first.

            const res = await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                },
                asResponse: false // Ensure we get the object back, not a Response
            });

            console.log("User created successfully via Auth API");
            user = res.user;
        } catch (e) {
            console.error("Failed to create user via Auth API:", e);
            // Fallback: This is tricky without the hasher.
            // But wait, if auth.api fails, we are stuck unless we instruct the user.
            process.exit(1);
        }
    } else {
        console.log("User already exists.");
    }

    // Promote to MANAGER
    if (user) {
        console.log("Promoting user to MANAGER (Superadmin)...");
        await prisma.user.update({
            where: { email },
            data: { role: "MANAGER" },
        });
        console.log("User promoted successfully!");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
