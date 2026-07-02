import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ZAPPER = "0x6b2387abbbed06401963C106C3233E6A65A8C347";
const MEME = "0x04E81F904174C552Ee99D8C77Cc4291352Cc8adE";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";

// Deployer key to use as signer for the simulation
const PRIVATE_KEY = "0x5dc5df158f328cd17b6a2aeaae16795917f473c901401fc90ec52d2537d88f2b";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`Simulating call from wallet: ${wallet.address}`);
  const bal = await provider.getBalance(wallet.address);
  console.log(`Wallet Balance: ${ethers.formatEther(bal)} ETH`);

  const zapper = new ethers.Contract(ZAPPER, [
    "function zapBuy(address memeToken, address collateralToken, uint24 poolFee, int24 tickSpacing) external payable"
  ], wallet);

  console.log("Simulating zapBuy via staticCall...");
  try {
    const tx = await zapper.zapBuy.staticCall(
      MEME,
      TSLA,
      50000,
      1000,
      { value: ethers.parseUnits("0.0001", 18) }
    );
    console.log("Static call succeeded! Return value:", tx);
  } catch (err) {
    console.log("Static call failed!");
    console.log("Error message:", err.message);
    if (err.data) {
      console.log("Error data:", err.data);
    } else if (err.info && err.info.error) {
      console.log("RPC Error detail:", err.info.error);
    }
  }
}

main().catch(console.error);
