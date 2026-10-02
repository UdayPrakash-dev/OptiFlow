import { prisma } from './src/config/prisma.js';
async function run() {
    const user = await prisma.user.findFirst({ where: { email: 'john@testcompany.com' } });
    console.log(user ? "User exists" : "User does not exist");
}
run();
