import 'dotenv/config';

async function main() {
    const API_URL = process.env.BACKEND_URL || "http://127.0.0.1:3000";
    console.log(`Testing login against ${API_URL}...`);

    const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: "admin@dewaks.com",
            password: "admin123",
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`Login failed: ${response.status} ${response.statusText}`);
        console.error(`Response: ${text}`);
        process.exit(1);
    }

    const data = await response.json();
    console.log("Login successful!");
    console.log("User:", data.user?.email);
    // console.log("Session:", data.session); // Don't log sensitive session token if possible, or just confirm it exists
}

main();
