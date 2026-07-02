import { ethers } from "ethers";

const TESTNET_RPC = "https://rpc.testnet.chain.robinhood.com";
const TSLA_ADDRESS = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const USER_ADDRESS = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";

async function main() {
  const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
  const token = new ethers.Contract(
    TSLA_ADDRESS,
    [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ],
    provider
  );
  
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    const balance = await token.balanceOf(USER_ADDRESS);
    const decimals = await token.decimals();
    console.log(`Testnet token at ${TSLA_ADDRESS}:`);
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Balance of ${USER_ADDRESS}: ${balance.toString()} (${ethers.formatUnits(balance, decimals)} ${symbol})`);
  } catch (err: any) {
    console.error("Error querying token on Testnet:", err.message);
  }
}

main();
