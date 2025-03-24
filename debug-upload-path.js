import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// This small utility will help you find the correct paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current file:", __filename);
console.log("Current directory:", __dirname);
console.log("Project root:", path.resolve(__dirname, "../"));
console.log("Src directory:", __dirname);

// For testing, create a test directory inside src
const testUploadDir = path.join(__dirname, "test_uploads");
console.log("Test upload directory:", testUploadDir);

try {
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
    console.log("✅ Successfully created test upload directory");
  } else {
    console.log("✅ Test upload directory already exists");
  }

  // Write a test file
  const testFile = path.join(testUploadDir, "test.txt");
  fs.writeFileSync(testFile, "This is a test file");
  console.log("✅ Successfully wrote test file to:", testFile);
} catch (err) {
  console.error("❌ Error:", err);
}
