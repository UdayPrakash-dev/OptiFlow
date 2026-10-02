const fs = require('fs');

function parseSchema(path) {
    const text = fs.readFileSync(path, 'utf8');
    const models = {};
    const lines = text.split('\n');
    
    let currentModel = null;
    let modelLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith('model ')) {
            currentModel = line.split(/\s+/)[1];
            modelLines = [];
        } else if (currentModel && line === '}') {
            let tableName = currentModel;
            const mapLine = modelLines.find(l => l.startsWith('@@map('));
            if (mapLine) {
                const match = mapLine.match(/@@map\("([^"]+)"\)/);
                if (match) tableName = match[1];
            }
            
            const fields = {};
            for (const ml of modelLines) {
                if (ml.startsWith('//') || ml.startsWith('@@')) continue;
                const parts = ml.split(/\s+/);
                if (parts.length >= 2) {
                    const fieldName = parts[0];
                    const fieldType = parts[1];
                    let mappedName = fieldName;
                    const mapMatch = ml.match(/@map\("([^"]+)"\)/);
                    if (mapMatch) mappedName = mapMatch[1];
                    fields[fieldName] = { type: fieldType, mappedName, original: ml };
                }
            }
            models[currentModel] = { tableName, fields };
            currentModel = null;
        } else if (currentModel) {
            if (line) modelLines.push(line);
        }
    }
    return models;
}

const db = parseSchema('/tmp/db_actual.prisma');
const schema = parseSchema('back-end-new/prisma/schema.prisma');

const dbByTable = {};
for (const m in db) dbByTable[db[m].tableName] = db[m];

console.log("| model | table | issue | column |");
console.log("|---|---|---|---|");

for (const modelName in schema) {
    const mSchema = schema[modelName];
    const mDb = dbByTable[mSchema.tableName] || db[modelName];
    
    if (!mDb) {
        console.log(`| ${modelName} | ${mSchema.tableName} | D | N/A |`);
        continue;
    }
    
    for (const fieldName in mSchema.fields) {
        const fieldSchema = mSchema.fields[fieldName];
        // Skip relations (heuristic: if type is a known model name or enum name that isn't mapped directly? No, relations don't have scalar equivalents in the DB schema unless they are foreign keys. Wait, db_actual DOES have relations if it has foreign keys.
        // Let's just compare mapped names for all fields. If it's not in db_actual, check if it's a relation.
        
        let dbField = null;
        for (const f in mDb.fields) {
            if (mDb.fields[f].mappedName === fieldSchema.mappedName || mDb.fields[f].mappedName === fieldName || f === fieldName) {
                dbField = mDb.fields[f];
                break;
            }
        }
        
        if (!dbField) {
            // Is it a relation?
            // In Prisma, relation fields have type matching another model
            const baseType = fieldSchema.type.replace('?', '').replace('[]', '');
            if (schema[baseType]) continue; // it's a relation field
            
            console.log(`| ${modelName} | ${mSchema.tableName} | A | ${fieldName} |`);
        } else {
             // check nullability
             // const schemaNullable = fieldSchema.type.endsWith('?');
             // const dbNullable = dbField.type.endsWith('?');
        }
    }
    
    // Check B
    for (const fieldName in mDb.fields) {
        const dbField = mDb.fields[fieldName];
        const baseType = dbField.type.replace('?', '').replace('[]', '');
        if (db[baseType] || schema[baseType]) continue;
        
        let schemaField = null;
        for (const f in mSchema.fields) {
            if (mSchema.fields[f].mappedName === dbField.mappedName || mSchema.fields[f].mappedName === fieldName || f === fieldName) {
                schemaField = mSchema.fields[f];
                break;
            }
        }
        
        if (!schemaField && !dbField.type.endsWith('?') && !dbField.original.includes('@default')) {
            console.log(`| ${modelName} | ${mDb.tableName} | B | ${fieldName} |`);
        } else if (!schemaField) {
            // It's in DB (nullable or has default), but not in schema
            // We only care about B if it's NOT NULL with no default
        }
    }
}
