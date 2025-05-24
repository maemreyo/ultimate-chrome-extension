const fs = require('fs');
const path = require('path');

// Define the documentation files to process
const docFiles = [
  'docs/2_chrome-extension-template.txt',
  'docs/3_chrome-extension-additional.txt',
  'docs/4_chrome-extension-premium-features.txt',
  'docs/5_chrome-extension-premium-setup.txt'
];

// Function to extract files from a documentation file
function extractFilesFromDoc(docFilePath) {
  console.log(`\n=== Processing ${docFilePath} ===`);
  
  // Read the documentation file
  const content = fs.readFileSync(docFilePath, 'utf8');
  
  // Remove the "Here's the snippet of the file located at..." line if present
  const cleanedContent = content.replace(/Here's the snippet of the file located at.*?:\n/g, '');
  
  // Split the content by file markers
  // This regex looks for file paths in comments like "// src/file.ts" or "// package.json"
  const fileRegex = /\/\/ ((?:src|\.env\.example|package\.json|tsconfig\.json|tailwind\.config\.js).*)/g;
  const sectionRegex = /\/\/ ===== (.+) =====/g;
  
  // Find all file markers and section headers
  const fileMarkers = [...cleanedContent.matchAll(fileRegex)];
  const sectionMarkers = [...cleanedContent.matchAll(sectionRegex)];
  
  // Combine all markers and sort by position
  const allMarkers = [...fileMarkers, ...sectionMarkers].sort((a, b) => a.index - b.index);
  
  if (allMarkers.length === 0) {
    console.log(`No file markers found in ${docFilePath}`);
    return;
  }
  
  // Process each file section
  for (let i = 0; i < allMarkers.length; i++) {
    const currentMarker = allMarkers[i];
    const nextMarker = allMarkers[i + 1];
    
    // Skip section headers
    if (currentMarker[0].includes('===== ')) {
      continue;
    }
    
    // Extract the file path from the marker
    let filePath = currentMarker[1].trim();
    
    // Calculate the content for this file
    const startPos = currentMarker.index + currentMarker[0].length;
    const endPos = nextMarker ? nextMarker.index : cleanedContent.length;
    let fileContent = cleanedContent.substring(startPos, endPos).trim();
    
    // Remove any leading line numbers and spaces that might be in the documentation
    fileContent = fileContent.replace(/^\s*\d+\s+/gm, '');
    
    // Create the file
    createFile(filePath, fileContent);
  }
}

// Function to create a file with the given content
function createFile(filePath, content) {
  // Skip if the file path is not valid
  if (!filePath || filePath.includes('=====')) {
    return;
  }
  
  console.log(`Processing file: ${filePath}`);
  
  // Create the directory if it doesn't exist
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    stats.directoriesCreated.add(dirPath);
    console.log(`Created directory: ${dirPath}`);
  }
  
  // Clean up the content
  // Remove any <response clipped> markers or other artifacts
  let cleanContent = content.replace(/<response clipped>.*?<\/NOTE>/s, '');
  
  // Remove any ```plaintext or ``` markers that might be in the documentation
  cleanContent = cleanContent.replace(/```plaintext\n/g, '').replace(/```\n/g, '');
  
  // Write the file
  fs.writeFileSync(filePath, cleanContent);
  stats.filesCreated++;
  console.log(`Created file: ${filePath}`);
}

// Create a stats object to track progress
const stats = {
  filesProcessed: 0,
  filesCreated: 0,
  directoriesCreated: new Set()
};

// Process each documentation file
docFiles.forEach(docFile => {
  try {
    extractFilesFromDoc(docFile);
    stats.filesProcessed++;
  } catch (error) {
    console.error(`Error processing ${docFile}:`, error);
  }
});

console.log('\n=== File extraction completed! ===');
console.log(`Documentation files processed: ${stats.filesProcessed}`);
console.log(`Directories created: ${stats.directoriesCreated.size}`);
console.log(`Files created: ${stats.filesCreated}`);