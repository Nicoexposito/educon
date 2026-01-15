
const bcrypt = require('bcryptjs');

async function generateHashes() {
    const p1 = await bcrypt.hash('oriol12345', 10);
    const p2 = await bcrypt.hash('nico12345', 10);

    console.log(JSON.stringify({ teacher: p1, student: p2 }));
}

generateHashes();
