const fs = require('fs');
const schemaActual = fs.readFileSync('/tmp/db_actual.prisma', 'utf8');

const regex = /model\s+ComplianceRule\s+\{([^}]+)\}/g;
const match = regex.exec(schemaActual);
const body = match[1];
const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('@@'));
console.log(lines);
