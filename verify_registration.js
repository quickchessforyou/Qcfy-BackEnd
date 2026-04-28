
async function verify() {
    const suffix = Math.floor(Math.random() * 10000);
    const user = {
        name: `Test User ${suffix}`,
        username: `testuser${suffix}`,
        email: `testuser${suffix}@example.com`,
        password: "password123",
        wins: 10,
        losses: 5,
        draws: 2
    };

    try {
        const response = await fetch('http://localhost:4000/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

        if (response.status === 200 && data.user) {
            if (data.user.wins === 10 && data.user.losses === 5 && data.user.draws === 2) {
                console.log("SUCCESS: User created with correct stats.");
            } else {
                console.log("FAILURE: User created but stats are incorrect.");
                console.log(`Expected: wins=10, losses=5, draws=2`);
                console.log(`Actual: wins=${data.user.wins}, losses=${data.user.losses}, draws=${data.user.draws}`);
            }
        } else {
            console.log("FAILURE: Registration failed.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

verify();
