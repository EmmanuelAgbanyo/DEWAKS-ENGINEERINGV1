import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking users in database...");
    const users = await prisma.user.findMany({
        include: {
            accounts: true,
        }
    });

    if (users.length === 0) {
        console.log("No users found in database.");
    } else {
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.email} (Role: ${u.role})`);
            console.log(`  Accounts: ${u.accounts.map(a => a.providerId).join(", ")}`);
            // check if credential account exists and has password
            const credAccount = u.accounts.find(a => a.providerId === "credential");
            if (credAccount) {
                console.log(`  Credential account exists. Password length: ${credAccount.password?.length}`);
            } else {
                console.log(`  WARNING: No 'credential' account found for this user.`);
            }
        });
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
