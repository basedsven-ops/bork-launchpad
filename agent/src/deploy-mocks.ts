import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const ENV_PATH             = path.join(__dirname, "../.env");
const MOCK_DEX_ARTIFACT    = path.join(__dirname, "../../contracts/out/MockDEX.sol/MockDEX.json");
const FACTORY_ARTIFACT     = path.join(__dirname, "../../contracts/out/TokenFactory.sol/TokenFactory.json");
const RWA_FACTORY_ARTIFACT = path.join(__dirname, "../../contracts/out/RWATokenFactory.sol/RWATokenFactory.json");

async function main() {
  console.log("🛠️ Preparing to deploy smart contracts to Robinhood Chain Testnet...");

  const rpcUrl     = process.env.RPC_URL || "https://rpc.testnet.chain.robinhood.com";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey === "your_private_key_here" || privateKey.trim() === "") {
    console.error("❌ PRIVATE_KEY is not set in agent/.env. Please configure it first.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet   = new ethers.Wallet(privateKey, provider);

  console.log(`🌐 Connected to network. Deployer address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("❌ Deployer balance is 0. Please fund this wallet with faucet ETH first.");
    process.exit(1);
  }

  let nonce = await wallet.getNonce();
  console.log(`📡 Starting nonce: ${nonce}`);

  // ─── 1. Deploy MockDEX ─────────────────────────────────────────────────────
  console.log("\n1️⃣ Deploying MockDEX...");
  if (!fs.existsSync(MOCK_DEX_ARTIFACT)) {
    console.error(`❌ MockDEX artifact not found. Run "forge build" first.`);
    process.exit(1);
  }
  const dexJson    = JSON.parse(fs.readFileSync(MOCK_DEX_ARTIFACT, "utf8"));
  const dexFactory = new ethers.ContractFactory(dexJson.abi, dexJson.bytecode.object, wallet);
  const dexDeploy  = await dexFactory.deploy({ nonce: nonce++ });
  console.log("⏳ Waiting for MockDEX deployment...");
  await dexDeploy.waitForDeployment();
  const dexAddress = await dexDeploy.getAddress();
  console.log(`✅ MockDEX deployed at: ${dexAddress}`);

  // ─── 2. Deploy TokenFactory (ETH-backed) ────────────────────────────────────
  console.log("\n2️⃣ Deploying TokenFactory (ETH-backed)...");
  if (!fs.existsSync(FACTORY_ARTIFACT)) {
    console.error(`❌ TokenFactory artifact not found. Run "forge build" first.`);
    process.exit(1);
  }
  const factoryJson    = JSON.parse(fs.readFileSync(FACTORY_ARTIFACT, "utf8"));
  const factoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode.object, wallet);
  const factoryDeploy  = await factoryFactory.deploy(dexAddress, { nonce: nonce++ });
  console.log("⏳ Waiting for TokenFactory deployment...");
  await factoryDeploy.waitForDeployment();
  const factoryAddress = await factoryDeploy.getAddress();
  console.log(`✅ TokenFactory deployed at: ${factoryAddress}`);

  // ─── 3. Deploy RWATokenFactory (RWA/Uniswap V3) ────────────────────────────
  let rwaFactoryAddress = "";
  console.log("\n3️⃣ Deploying RWATokenFactory (RWA-backed / Uniswap V3)...");
  if (!fs.existsSync(RWA_FACTORY_ARTIFACT)) {
    console.warn("⚠️  RWATokenFactory artifact not found. Skipping. Run 'forge build' first.");
  } else {
    const rwaJson        = JSON.parse(fs.readFileSync(RWA_FACTORY_ARTIFACT, "utf8"));
    const rwaFactory     = new ethers.ContractFactory(rwaJson.abi, rwaJson.bytecode.object, wallet);
    const rwaDeploy      = await rwaFactory.deploy({ nonce: nonce++ });
    console.log("⏳ Waiting for RWATokenFactory deployment...");
    await rwaDeploy.waitForDeployment();
    rwaFactoryAddress    = await rwaDeploy.getAddress();
    console.log(`✅ RWATokenFactory deployed at: ${rwaFactoryAddress}`);
    console.log(`   🏦 Supports RDDT (0x05b37Fb...) / UMC (0x0E6e67...) / WETH (0x0Bd7D3...)`);
  }

  // ─── 4. Update .env ────────────────────────────────────────────────────────
  console.log("\n💾 Updating agent/.env file...");
  let envContent = fs.readFileSync(ENV_PATH, "utf8");
  envContent = envContent.replace(/FACTORY_ADDRESS=0x[0-9a-fA-F]*/g, `FACTORY_ADDRESS=${factoryAddress}`);
  envContent = envContent.replace(/DEX_ADDRESS=0x[0-9a-fA-F]*/g,     `DEX_ADDRESS=${dexAddress}`);

  if (rwaFactoryAddress) {
    if (envContent.includes("RWA_FACTORY_ADDRESS=")) {
      envContent = envContent.replace(/RWA_FACTORY_ADDRESS=0x[0-9a-fA-F]*/g, `RWA_FACTORY_ADDRESS=${rwaFactoryAddress}`);
    } else {
      envContent += `\nRWA_FACTORY_ADDRESS=${rwaFactoryAddress}\n`;
    }
  }

  fs.writeFileSync(ENV_PATH, envContent, "utf8");
  console.log("🎉 .env file successfully updated with new contract addresses!\n");
  console.log(`🚀 All contracts ready:`);
  console.log(`   DEX_ADDRESS         = ${dexAddress}`);
  console.log(`   FACTORY_ADDRESS     = ${factoryAddress}`);
  if (rwaFactoryAddress) {
    console.log(`   RWA_FACTORY_ADDRESS = ${rwaFactoryAddress}`);
  }
}

main().catch(error => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
