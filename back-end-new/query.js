import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const v = await prisma.complianceViolation.findMany()
  console.log('Violations:', v.length)
  const e = await prisma.complianceEvidence.findMany()
  console.log('Evidence:', e.length)
  console.log(v.map(x => x.status))
  console.log(e.map(x => x.status))
}
main().catch(console.error).finally(() => prisma.$disconnect())
