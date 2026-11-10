// Node.js Installation Helper
// Run this with: node install-node.js

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const NODE_VERSION = '20.18.0';
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`;

console.log('Primegram Node.js Setup Helper');
console.log('================================');

// Check if Node.js is already installed
exec('node --version', (error, stdout) => {
  if (!error) {
    console.log('Node.js is already installed:', stdout.trim());
    console.log('You can now run: npm install && npm run dev');
    return;
  }

  console.log('Node.js not found. Downloading portable version...');
  
  // Download Node.js
  const file = fs.createWriteStream('node-portable.zip');
  
  https.get(NODE_URL, (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log('Node.js downloaded successfully!');
      console.log('Extracting...');
      
      // Extract (would need additional libraries for ZIP extraction)
      console.log('Please extract node-portable.zip and add to PATH');
      console.log('Then run: npm install && npm run dev');
    });
  }).on('error', (err) => {
    console.error('Download error:', err.message);
    console.log('Please download Node.js manually from https://nodejs.org');
  });
});
