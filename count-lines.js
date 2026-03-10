const fs = require('fs');
const path = require('path');

const exts = ['.ts', '.tsx', '.sol', '.css'];
const excludes = ['node_modules', 'dist', 'artifacts', 'cache', 'typechain-types', '.next', 'subgraph', '.git'];

let totalLines = 0;
let fileCount = 0;

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (excludes.includes(file)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (stat.isFile() && exts.includes(path.extname(file))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            totalLines += content.split('\n').length;
            fileCount++;
        }
    }
}

walk(__dirname);
console.log(`Total Lines: ${totalLines}`);
console.log(`Total Files: ${fileCount}`);
