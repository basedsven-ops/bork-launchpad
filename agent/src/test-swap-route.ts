import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ROUTER = ethers.getAddress("0x4262efBd176F02824af27010bEa218429c33c7E8".toLowerCase());

const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  console.log(`Testing multi-hop exactInput on ROUTER (${ROUTER})...`);
  
  const router = new ethers.Contract(ROUTER, [
    "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) external payable returns (uint256)"
  ], provider);

  // Try different fee combinations: 3000 (0.3%) and 500 (0.05%)
  const fees = [3000, 500, 10000];

  for (const fee1 of fees) {
    for (const fee2 of fees) {
      console.log(`Trying path: WETH -[fee1=${fee1}]-> USDG -[fee2=${fee2}]-> TSLA...`);
      const path = ethers.solidityPacked(
        ["address", "uint24", "address", "uint24", "address"],
        [WETH, fee1, USDG, fee2, TSLA]
      );
      
      const params = {
        path: path,
        recipient: ethers.ZeroAddress,
        deadline: Math.floor(Date.now() / 1000) + 3600,
        amountIn: ethers.parseUnits("0.0001", 18),
        amountOutMinimum: 0
      };

      try {
        await router.exactInput.staticCall(params);
        console.log(`  SUCCESS with fee1=${fee1}, fee2=${fee2}!`);
        return;
      } catch (err) {
        console.log(`  Failed:`, err.message);
      }
    }
  }
}

main().catch(console.error);
