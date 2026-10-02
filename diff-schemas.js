const fs = require('fs');
const schemaActual = fs.readFileSync('/tmp/db_actual.prisma', 'utf8');
const schemaExpected = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8');

function parseModels(schema) {
    const models = {};
    const regex = /model\s+(\w+)\s+\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(schema)) !== null) {
        const name = match[1];
        const body = match[2];
        const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('@@'));
        const mapMatch = body.match(/@@map\("([^"]+)"\)/);
        const tableName = mapMatch ? mapMatch[1] : name;
        
        const fields = {};
        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const fieldName = parts[0];
                const fieldType = parts[1];
                let mappedName = fieldName;
                const mapFieldMatch = line.match(/@map\("([^"]+)"\)/);
                if (mapFieldMatch) mappedName = mapFieldMatch[1];
                
                fields[fieldName] = { type: fieldType, mappedName, originalLine: line };
            }
        }
        models[name] = { tableName, fields };
    }
    return models;
}

const db = parseModels(schemaActual);
const schema = parseModels(schemaExpected);

// Find models by table name
const dbByTable = {};
for (const m in db) {
    dbByTable[db[m].tableName] = db[m];
}

console.log("| model | table | issue | column |");
console.log("|---|---|---|---|");

for (const modelName in schema) {
    const mSchema = schema[modelName];
    const mDb = dbByTable[mSchema.tableName] || db[modelName]; // match by table or name
    
    if (!mDb) {
        console.log(`| ${modelName} | ${mSchema.tableName} | D | N/A |`);
        continue;
    }
    
    for (const fieldName in mSchema.fields) {
        const fieldSchema = mSchema.fields[fieldName];
        // skip relational fields (where type is another model)
        if (schema[fieldSchema.type.replace('?', '').replace('[]', '')]) continue;
        
        // Find corresponding field in DB by mappedName
        let dbField = null;
        for (const f in mDb.fields) {
            if (mDb.fields[f].mappedName === fieldSchema.mappedName || mDb.fields[f].mappedName === fieldName) {
                dbField = mDb.fields[f];
                break;
            }
        }
        
        if (!dbField) {
            console.log(`| ${modelName} | ${mSchema.tableName} | A | ${fieldName} |`);
        } else {
            // Check type mismatch
            // DB introspection might map types differently (e.g., Decimal vs Float) but let's check basic nullability
            const schemaNullable = fieldSchema.type.endsWith('?');
            const dbNullable = dbField.type.endsWith('?');
            
            if (schemaNullable !== dbNullable) {
               // console.log(`| ${modelName} | ${mSchema.tableName} | C | ${fieldName} (nullability) |`);
            }
        }
    }
    
    // Check for B (in DB, NOT NULL, missing in schema)
    for (const fieldName in mDb.fields) {
        const dbField = mDb.fields[fieldName];
        if (db[dbField.type.replace('?', '').replace('[]', '')]) continue; // skip relations
        
        // Find in schema
        let schemaField = null;
        for (const f in mSchema.fields) {
            if (mSchema.fields[f].mappedName === dbField.mappedName || mSchema.fields[f].mappedName === fieldName) {
                schemaField = mSchema.fields[f];
                break;
            }
        }
        
        if (!schemaField && !dbField.type.endsWith('?') && !dbField.originalLine.includes('@default')) {
            console.log(`| ${modelName} | ${mDb.tableName} | B | ${fieldName} |`);
        }
    }
}

