import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";

const TOKENS = {
  RDDT: "0x05b37Fb53A299a1b874A619e1c4C404D52C36F4C",
  UMC:  "0x0E6e67Ba88e7b5d9B67636A215c76779B948dE79",
  WETH: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
};

// Some known accounts that might hold tokens
const TEST_SPENDER = "0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f"; // random test addr
const UNISWAP_ROUTER = "0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77"; // real router

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

// Check if token contract has restriction functions
const RESTRICTION_ABI = [
  "function isBlocked(address) view returns (bool)",
  "function isWhitelisted(address) view returns (bool)",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
  "function implementation() view returns (address)",
  "function transferable() view returns (bool)",
  "function transferRestriction() view returns (address)",
];

async function checkToken(provider: ethers.JsonRpcProvider, symbol: string, address: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`🔍 Checking $${symbol} at ${address}`);
  console.log(`${"─".repeat(60)}`);

  const contract = new ethers.Contract(address, [...ERC20_ABI, ...RESTRICTION_ABI], provider);

  // Basic info
  try {
    const name = await contract.name();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    console.log(`  📛 Name:        ${name}`);
    console.log(`  🔢 Decimals:    ${decimals}`);
    console.log(`  💰 Total Supply: ${ethers.formatEther(totalSupply)}`);
  } catch (e: any) {
    console.log(`  ❌ Basic info failed: ${e.message}`);
  }

  // Check restriction functions
  console.log(`\n  🔒 Checking Restrictions:`);

  try {
    const paused = await contract.paused();
    console.log(`  📌 paused()         = ${paused}`);
  } catch { console.log(`  📌 paused()         = ❌ Not found`); }

  try {
    const blocked = await contract.isBlocked(TEST_SPENDER);
    console.log(`  🚫 isBlocked(random)= ${blocked}`);
  } catch { console.log(`  🚫 isBlocked()      = ❌ Not found`); }

  try {
    const blockedUni = await contract.isBlocked(UNISWAP_ROUTER);
    console.log(`  🚫 isBlocked(V3 router)= ${blockedUni}`);
  } catch { console.log(`  🚫 isBlocked(router)= ❌ Not found`); }

  try {
    const whitelisted = await contract.isWhitelisted(TEST_SPENDER);
    console.log(`  ✅ isWhitelisted()  = ${whitelisted}`);
  } catch { console.log(`  ✅ isWhitelisted()  = ❌ Not found`); }

  // Get bytecode size and proxy info
  const code = await provider.getCode(address);
  console.log(`\n  📦 Bytecode size: ${(code.length - 2) / 2} bytes`);
  const isProxy = code.length < 200; // likely a minimal proxy
  console.log(`  🔀 Is likely proxy: ${isProxy}`);

  // Check implementation if proxy
  try {
    const impl = await contract.implementation();
    console.log(`  🏗️  Implementation: ${impl}`);
    const implCode = await provider.getCode(impl);
    console.log(`  📦 Impl size: ${(implCode.length - 2) / 2} bytes`);
  } catch { }

  // Try a static call simulation: approve
  // This simulates if a random contract can call approve (non-state-changing to check restrictions)
  console.log(`\n  🧪 Simulating approve() from random address:`);
  try {
    const iface = new ethers.Interface(ERC20_ABI);
    const data = iface.encodeFunctionData("approve", [UNISWAP_ROUTER, ethers.parseEther("1")]);
    const result = await provider.call({
      to: address,
      data,
      from: TEST_SPENDER,
    });
    console.log(`  ✅ approve() static call SUCCEEDED → token is NOT blocking approvals`);
  } catch (e: any) {
    console.log(`  ❌ approve() static call FAILED → ${e.message?.slice(0, 100)}`);
  }

  // Check token holders — find a real holder who has balance
  console.log(`\n  👛 Checking real holders:`);
  const transferTopic = ethers.id("Transfer(address,address,uint256)");
  try {
    const logs = await provider.getLogs({
      address,
      topics: [transferTopic],
      fromBlock: 0,
      toBlock: "latest"
    });
    const holders = new Set<string>();
    for (const log of logs.slice(-20)) {
      if (log.topics[2]) {
        const to = "0x" + log.topics[2].slice(26);
        holders.add(ethers.getAddress(to));
      }
    }
    const holderList = Array.from(holders).slice(0, 3);
    for (const holder of holderList) {
      try {
        const bal = await contract.balanceOf(holder);
        if (bal > 0n) {
          console.log(`  👛 Holder ${holder}: ${ethers.formatEther(bal)} tokens`);

          // Try simulate transferFrom FROM this holder TO our test contract
          const transferFromABI = ["function transferFrom(address from, address to, uint256 amount) returns (bool)"];
          const iface2 = new ethers.Interface(transferFromABI);
          const data = iface2.encodeFunctionData("transferFrom", [holder, TEST_SPENDER, ethers.parseEther("0.001")]);
          try {
            await provider.call({
              to: address,
              data,
              from: TEST_SPENDER, // simulate our contract calling transferFrom
            });
            console.log(`  ✅ transferFrom() from ${holder} → SUCCEEDED (no allowance check in static call, but no hard block)`);
          } catch (e: any) {
            const msg = e.message?.slice(0, 120);
            console.log(`  ❌ transferFrom() FAILED → ${msg}`);
          }
        }
      } catch {}
    }
  } catch (e: any) {
    console.log(`  ⚠️  Could not fetch holders: ${e.message?.slice(0, 80)}`);
  }
}

async function main() {
  console.log("🔬 Checking RWA Token Permissions on Robinhood Chain Mainnet (Poptye)");
  console.log(`📡 RPC: ${RPC_URL}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const block = await provider.getBlockNumber();
  console.log(`✅ Connected — Block: ${block}`);

  for (const [symbol, address] of Object.entries(TOKENS)) {
    await checkToken(provider, symbol, address);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("✅ Done!");
}

main().catch(console.error);
