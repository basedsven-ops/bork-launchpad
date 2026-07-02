import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";

const ROUTERS = [
  "0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77",
  "0x7b021ceB65eDAf40ED73c51e78cF44Ad4EdF99A4",
  "0xe72688F7d25D7318B9A81F21EdDa640CA948c83B"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const router of ROUTERS) {
    console.log(`\nTesting contract at ${router}:`);
    
    // Check WETH9()
    try {
      const contract = new ethers.Contract(router, ["function WETH9() view returns (address)"], provider);
      const weth = await contract.WETH9();
      console.log(` ✅ Has WETH9(): ${weth}`);
    } catch (e: any) {
      console.log(` ❌ No WETH9()`);
    }

    // Check factory()
    try {
      const contract = new ethers.Contract(router, ["function factory() view returns (address)"], provider);
      const factory = await contract.factory();
      console.log(` ✅ Has factory(): ${factory}`);
    } catch (e: any) {
      console.log(` ❌ No factory()`);
    }

    // Check swapExactInputSingle
    try {
      // Just check if selector exists by doing a dry-run or checking if it supports the interface
      console.log("  - Might support SwapRouter methods.");
    } catch (e) {}
  }
}

main();
