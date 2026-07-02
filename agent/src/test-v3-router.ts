import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";

const TARGETS: Record<string, string> = {
  "Factory": "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
  "NonfungiblePositionManager": "0xcaf681a66d020601342297493863e78c959e5cb2",
  "SwapRouter02": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  "SwapRouter": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  "UniversalRouter": "0x3fC91A3afd2039594d5576b25988EB3b2e72a0c4",
  "UniversalRouterAlt": "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b",
  "ClankerFactoryClone": "0xD9eC2db5f3D1b236843925949fe5bd8a3836FCcB"
};

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log(`Checking Uniswap V3 Addresses on Robinhood Chain (${RPC_URL}):`);
  for (const [name, addr] of Object.entries(TARGETS)) {
    const code = await provider.getCode(addr);
    if (code !== "0x") {
      console.log(`🟢 ${name} is DEPLOYED at ${addr} (Code size: ${code.length - 2} bytes)`);
    } else {
      console.log(`❌ ${name} is NOT deployed at ${addr}`);
    }
  }
}

main();
