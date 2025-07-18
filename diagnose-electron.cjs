#!/usr/bin/env node

// Comprehensive diagnostic script
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('=== Electron App Diagnostic Tool ===\n');

// Check file structure
console.log('1. Checking file structure...');
const requiredFiles = [
  'electron-main.js',
  'electron-package.json', 
  'preload.js',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✓ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`✗ ${file} - MISSING`);
  }
});

// Check package.json configurations
console.log('\n2. Checking package.json files...');

if (fs.existsSync('package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`Main package.json: name="${pkg.name}", type="${pkg.type}", main="${pkg.main || 'not set'}"`);
  } catch (e) {
    console.log('✗ Error reading package.json:', e.message);
  }
}

if (fs.existsSync('electron-package.json')) {
  try {
    const epkg = JSON.parse(fs.readFileSync('electron-package.json', 'utf8'));
    console.log(`Electron package.json: name="${epkg.name}", main="${epkg.main}"`);
  } catch (e) {
    console.log('✗ Error reading electron-package.json:', e.message);
  }
}

// Check Node.js and Electron versions
console.log('\n3. Checking versions...');
console.log(`Node.js: ${process.version}`);

// Test Electron availability
const testElectron = () => {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['electron', '--version'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    let output = '';
    proc.stdout.on('data', (data) => output += data.toString());
    proc.stderr.on('data', (data) => output += data.toString());
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`Electron: ${output.trim()}`);
      } else {
        console.log(`✗ Electron test failed (code ${code}): ${output.trim()}`);
      }
      resolve(code === 0);
    });
  });
};

// Test different launch methods
const testLaunchMethods = async () => {
  console.log('\n4. Testing launch methods...');
  
  const methods = [
    ['npx', ['electron', '--version']],
    ['npx', ['electron', '.']],
    ['npx', ['electron', 'electron-main.js']],
    ['npx', ['electron', '.', '--package-json=electron-package.json']]
  ];
  
  for (const [cmd, args] of methods) {
    console.log(`Testing: ${cmd} ${args.join(' ')}`);
    
    try {
      const result = await new Promise((resolve) => {
        const proc = spawn(cmd, args, { 
          stdio: 'pipe',
          shell: true,
          timeout: 5000
        });
        
        let output = '';
        proc.stdout.on('data', (data) => output += data.toString());
        proc.stderr.on('data', (data) => output += data.toString());
        
        proc.on('close', (code) => {
          resolve({ code, output: output.slice(0, 200) });
        });
        
        proc.on('error', (error) => {
          resolve({ code: -1, output: error.message });
        });
        
        // Kill after timeout
        setTimeout(() => proc.kill(), 5000);
      });
      
      if (result.code === 0) {
        console.log(`  ✓ Success`);
      } else {
        console.log(`  ✗ Failed (${result.code}): ${result.output.trim()}`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }
};

// Run diagnostics
(async () => {
  await testElectron();
  await testLaunchMethods();
  
  console.log('\n5. Recommendations:');
  
  if (!fs.existsSync('electron-main.js')) {
    console.log('- Create electron-main.js file');
  }
  
  if (!fs.existsSync('electron-package.json')) {
    console.log('- Create electron-package.json with proper main field');
  }
  
  console.log('- Try the basic test: npx electron test-basic-electron.js');
  console.log('- Check development server is running on port 5000');
  console.log('- Consider using CommonJS syntax instead of ES modules');
})();