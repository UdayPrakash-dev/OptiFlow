const fs = require('fs');
const path = require('path');

const baseCss = fs.readFileSync('react_frontend/src/styles/old-frontend/base.css', 'utf8');
const landingCss = fs.readFileSync('react_frontend/src/styles/old-frontend/landing.css', 'utf8');

// Combine
let combined = baseCss + '\n' + landingCss;

// Replace root generic tags to avoid global bleeding
combined = combined.replace(/\*\s*\{/g, '.marketing-page * {');
combined = combined.replace(/body\s*\{/g, '.marketing-page {');
combined = combined.replace(/^a\s*\{/gm, '.marketing-page a {');
combined = combined.replace(/^ul\s*\{/gm, '.marketing-page ul {');

// Create the target directory if it doesn't exist
fs.mkdirSync('react_frontend/src/features/common/styles', { recursive: true });
fs.writeFileSync('react_frontend/src/features/common/styles/marketing.css', combined);
