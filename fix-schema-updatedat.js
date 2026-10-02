const fs = require('fs');
let schema = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8');

const blocks = schema.split(/model /);
for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i];
    if (!block.includes('updatedAt')) {
        // find the first '@@' or '}' and insert right before it
        let insertPos = block.indexOf('@@');
        if (insertPos === -1) {
            insertPos = block.indexOf('}');
        }
        
        if (insertPos !== -1) {
             const before = block.substring(0, insertPos);
             const after = block.substring(insertPos);
             blocks[i] = before + '  updatedAt DateTime @updatedAt\n\n' + after;
        }
    }
}
fs.writeFileSync('back-end-new/prisma/schema.prisma', blocks.join('model '));
