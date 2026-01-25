import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up users and sessions...");

    // Delete in order to respect foreign keys
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.cashRequest.deleteMany(); // Warning: Deletes existing requests too, which is cleaner for a "reset"
    await prisma.user.deleteMany();

    console.log("Database wiped of user data.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
