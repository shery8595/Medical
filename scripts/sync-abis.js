const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'artifacts', 'contracts');
const destDir = path.join(process.cwd(), 'src', 'lib', 'contracts', 'abis');
const subgraphDestDir = path.join(process.cwd(), 'subgraph', 'abis');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}
if (!fs.existsSync(subgraphDestDir)) {
    fs.mkdirSync(subgraphDestDir, { recursive: true });
}

const SUBGRAPH_ABIS = new Set([
    'AnonymousPatientRegistry.json',
    'ConfidentialETH.json',
    'ConsentManager.json',
    'DataAccessLog.json',
    'EligibilityEngine.json',
    'MedVaultAutomation.json',
    'MedVaultRegistry.json',
    'SponsorIncentiveVault.json',
    'SponsorRegistry.json',
    'StakingManager.json',
    'TrialManager.json',
    'TrialMilestoneManager.json'
]);

function copyAbis(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            copyAbis(fullPath);
        } else if (file.endsWith('.json') && !file.endsWith('.dbg.json')) {
            const destPath = path.join(destDir, file);
            fs.copyFileSync(fullPath, destPath);
            console.log(`Copied ${file} to ${destPath}`);
            if (SUBGRAPH_ABIS.has(file)) {
                const subgraphDestPath = path.join(subgraphDestDir, file);
                fs.copyFileSync(fullPath, subgraphDestPath);
                console.log(`Copied ${file} to ${subgraphDestPath}`);
            }
        }
    }
}

copyAbis(srcDir);
