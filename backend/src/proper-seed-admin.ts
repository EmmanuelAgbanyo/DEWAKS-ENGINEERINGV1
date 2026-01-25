import 'dotenv/config';

async function main() {
    console.log("Starting proper admin seed via API...");

    const email = "admin@dewaks.com";
    const password = "admin123";
    const name = "Super Admin";

    // Use 127.0.0.1 explicitly to avoid Node.js localhost IPv6 issues
    // Defaulting to 3001 as we are forcing backend to run there
    const API_URL = process.env.BACKEND_URL || "http://127.0.0.1:3001";

    console.log(`Connecting to ${API_URL}...`);

    // Retry logic
    const maxRetries = 20;
    for (let i = 0; i < maxRetries; i++) {
        try {
            await fetch(`${API_URL}/health`);
            console.log("Server is up!");
            break;
        } catch (e) {
            if (i === maxRetries - 1) {
                console.error("Server failed to respond after retries.");
                process.exit(1);
            }
            console.log(`Waiting for server... (${i + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    try {
        // 1. Sign Up
        console.log("Sending sign-up request...");
        const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
                name,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Sign up failed: ${response.status} ${response.statusText}`);
            console.error(`Response body: ${text}`);
            // Proceed to promote anyway in case user exists
        } else {
            const data = await response.json();
            console.log("Sign up successful:", data);
        }

        // 2. Promote to MANAGER directly in DB
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();

        console.log("Promoting user to MANAGER...");
        const user = await prisma.user.update({
            where: { email },
            data: { role: "MANAGER" },
        });

        console.log("User promoted to MANAGER (Superadmin). Role:", user.role);
        await prisma.$disconnect();

    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

main();
