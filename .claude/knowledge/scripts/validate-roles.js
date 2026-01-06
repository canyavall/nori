const kn = require('../knowledge.json');
const fs = require('fs');
const roles = kn.roles;
const allPackages = new Set();

Object.values(kn.knowledge).forEach(cat => {
  Object.keys(cat).forEach(pkg => allPackages.add(pkg));
});

let errors = 0;
console.log('=== VALIDATING ROLES ===\n');

Object.entries(roles).forEach(([role, config]) => {
  console.log(role + ': ' + config.packages.length + ' packages');
  
  config.packages.forEach(pkg => {
    if (!allPackages.has(pkg)) {
      console.error('  ❌ Package not found: ' + pkg);
      errors++;
    }
  });
  
  const sharedPkgs = ['shared-code-conventions', 'api-contracts', 'git-workflow'];
  const roleShared = config.packages.slice(0, 3);
  const hasAllShared = sharedPkgs.every(pkg => roleShared.includes(pkg));
  
  if (hasAllShared) {
    console.log('  ✓ Shared packages included');
  } else {
    console.error('  ❌ Missing shared packages');
    errors++;
  }
});

console.log('\n=== VALIDATING SHARED NAMESPACE ===\n');
const sharedPackages = kn.knowledge.shared || {};
console.log('Shared packages: ' + Object.keys(sharedPackages).length);
Object.keys(sharedPackages).forEach(pkg => {
  console.log('  ✓ ' + pkg);
});

console.log('\n=== VALIDATING KNOWLEDGE FILES ===\n');
let missingFiles = 0;

Object.values(kn.knowledge).forEach(cat => {
  Object.entries(cat).forEach(([pkgName, pkgData]) => {
    if (pkgData.knowledge_path) {
      if (!fs.existsSync(pkgData.knowledge_path)) {
        console.error('❌ Missing file: ' + pkgData.knowledge_path + ' (' + pkgName + ')');
        missingFiles++;
      }
    }
  });
});

if (missingFiles === 0) {
  console.log('✓ All knowledge files exist');
} else {
  console.error('❌ ' + missingFiles + ' missing files');
  errors += missingFiles;
}

if (errors === 0) {
  console.log('\n✅ ALL VALIDATIONS PASSED');
} else {
  console.error('\n❌ FOUND ' + errors + ' ERRORS');
  process.exit(1);
}
