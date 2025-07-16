const fs = require('fs');
const path = require('path');

console.log('🔍 Checking frontend build...');

const buildPath = path.join(__dirname, 'client/build');
const indexPath = path.join(buildPath, 'index.html');

console.log('📁 Current directory:', __dirname);
console.log('📁 Build path:', buildPath);
console.log('📄 Index path:', indexPath);

// Check if directories exist
console.log('📁 Build directory exists:', fs.existsSync(buildPath));
console.log('📄 Index file exists:', fs.existsSync(indexPath));

// List contents of current directory
console.log('📋 Contents of current directory:');
try {
  const files = fs.readdirSync(__dirname);
  files.forEach(file => {
    const stat = fs.statSync(path.join(__dirname, file));
    console.log(`  ${file} (${stat.isDirectory() ? 'dir' : 'file'})`);
  });
} catch (err) {
  console.error('❌ Error reading directory:', err.message);
}

// List contents of client directory if it exists
const clientPath = path.join(__dirname, 'client');
if (fs.existsSync(clientPath)) {
  console.log('📋 Contents of client directory:');
  try {
    const files = fs.readdirSync(clientPath);
    files.forEach(file => {
      const stat = fs.statSync(path.join(clientPath, file));
      console.log(`  ${file} (${stat.isDirectory() ? 'dir' : 'file'})`);
    });
  } catch (err) {
    console.error('❌ Error reading client directory:', err.message);
  }
} else {
  console.log('❌ Client directory does not exist');
}

// Check if build directory exists and list its contents
if (fs.existsSync(buildPath)) {
  console.log('📋 Contents of build directory:');
  try {
    const files = fs.readdirSync(buildPath);
    files.forEach(file => {
      const stat = fs.statSync(path.join(buildPath, file));
      console.log(`  ${file} (${stat.isDirectory() ? 'dir' : 'file'})`);
    });
  } catch (err) {
    console.error('❌ Error reading build directory:', err.message);
  }
} else {
  console.log('❌ Build directory does not exist');
}

console.log('✅ Build check complete'); 