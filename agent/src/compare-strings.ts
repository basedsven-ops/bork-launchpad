import fs from "fs";

const content = fs.readFileSync("/Users/bob/.gemini/antigravity/scratch/robinhood_bankr/contracts/src/BorkZapper.sol", "utf8");
const match = content.match(/POOL_MANAGER = ([^;]+);/);
if (match) {
  const fileAddress = match[1].trim();
  const correct = "0x8366a39CC670B4001A1121B8F6A443a643e40951";
  console.log(`File address: "${fileAddress}"`);
  console.log(`Correct:      "${correct}"`);
  console.log(`Equal?        ${fileAddress === correct}`);
  
  // print character codes
  console.log("File address char codes:", Array.from(fileAddress).map(c => c.charCodeAt(0)));
  console.log("Correct char codes:     ", Array.from(correct).map(c => c.charCodeAt(0)));
} else {
  console.log("POOL_MANAGER not found in file.");
}
