import { prisma } from './src/config/prisma.js';
async function test() {
   console.log(Object.keys(prisma._baseDmmf.modelMap.Task.fields.find(f => f.name === 'companyId') || {}));
}
test();
