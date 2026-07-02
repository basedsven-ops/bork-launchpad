import { ethers } from "ethers";
import { BlockchainManager } from "./wallet";

export class TransactionHandler {
  private manager: BlockchainManager;

  constructor(manager: BlockchainManager) {
    this.manager = manager;
  }

  // ─── ORIGINAL: ETH-backed token launch ───────────────────────────────────
  public async launchToken(name: string, symbol: string, ethLiquidity: string) {
    if (!this.manager.wallet || !this.manager.factoryContract) {
      throw new Error("❌ Wallet or Factory contract not initialized. Check your PRIVATE_KEY and FACTORY_ADDRESS.");
    }

    console.log(`🚀 Launching token: "${name}" (${symbol}) with ${ethLiquidity} ETH liquidity...`);
    
    const value = ethers.parseEther(ethLiquidity);
    const nonce = await this.manager.provider.getTransactionCount(this.manager.wallet.address, "pending");
    const tx = await this.manager.factoryContract.createToken(name, symbol, { value, nonce });
    
    console.log(`⏳ Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    
    // Parse event logs to get token address
    let tokenAddress: string | null = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.manager.factoryContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "TokenCreated") {
          tokenAddress = parsedLog.args[0];
          break;
        }
      } catch (e) {
        // Skip log parsing errors from other contracts
      }
    }

    if (!tokenAddress) {
      throw new Error("⚠️ Transaction confirmed but could not parse TokenCreated event log.");
    }

    this.manager.saveTokenToRegistry(symbol, tokenAddress);
    return { tokenAddress, txHash: tx.hash };
  }

  // ─── NEW: RWA-backed token launch via RWATokenFactory ────────────────────
  public async launchTokenBackedByRWA(
    name: string,
    symbol: string,
    collateralSymbol: string,
    targetCollateralAmount: string
  ) {
    if (!this.manager.wallet || !this.manager.rwaFactoryContract) {
      throw new Error("❌ RWA Factory contract not initialized. Check RWA_FACTORY_ADDRESS in .env");
    }

    const collateralAddress = this.manager.resolveRWAToken(collateralSymbol);
    const targetAmount = ethers.parseEther(targetCollateralAmount);

    console.log(`🚀 Launching RWA-backed token: "${name}" (${symbol})`);
    console.log(`   📊 Collateral: ${targetCollateralAmount} $${collateralSymbol.toUpperCase()} (${collateralAddress})`);

    const nonce = await this.manager.provider.getTransactionCount(this.manager.wallet.address, "pending");
    const tx = await this.manager.rwaFactoryContract.launchToken(name, symbol, collateralAddress, targetAmount, { nonce });

    console.log(`⏳ Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();

    // Parse TokenLaunched event
    let tokenAddress: string | null = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.manager.rwaFactoryContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "TokenLaunched") {
          tokenAddress = parsedLog.args[0];
          break;
        }
      } catch (e) {
        // skip
      }
    }

    if (!tokenAddress) {
      throw new Error("⚠️ Transaction confirmed but could not parse TokenLaunched event log.");
    }

    this.manager.saveTokenToRegistry(symbol, tokenAddress, collateralSymbol);
    console.log(`✅ Token deployed at: ${tokenAddress}`);
    console.log(`   📦 Bonding curve active — target: ${targetCollateralAmount} $${collateralSymbol.toUpperCase()}`);

    return { tokenAddress, txHash: tx.hash };
  }

  // ─── NEW: Buy memecoin with RWA token via RWATokenFactory ─────────────────
  public async buyTokenWithRWA(memeSymbol: string, collateralAmount: string) {
    if (!this.manager.wallet || !this.manager.rwaFactoryContract) {
      throw new Error("❌ RWA Factory contract not initialized. Check RWA_FACTORY_ADDRESS in .env");
    }

    const tokenAddress = this.manager.getTokenAddress(memeSymbol);
    if (!tokenAddress) {
      throw new Error(`❌ Token "${memeSymbol}" not registered. Launch it first!`);
    }

    // Get the collateral token for this meme token from registry
    const collateralSymbol = this.manager.getCollateralSymbol(memeSymbol);
    if (!collateralSymbol) {
      throw new Error(`❌ No RWA collateral found for "${memeSymbol}". Maybe it was launched with ETH?`);
    }

    const collateralAddress = this.manager.resolveRWAToken(collateralSymbol);
    const amount = ethers.parseEther(collateralAmount);
    const collateralToken = this.manager.getERC20(collateralAddress);

    // Check user has enough RWA tokens
    const balance = await collateralToken.balanceOf(this.manager.wallet.address);
    if (balance < amount) {
      throw new Error(`❌ Insufficient $${collateralSymbol} balance. Have: ${ethers.formatEther(balance)}, Need: ${collateralAmount}`);
    }

    console.log(`💸 Buying $${memeSymbol.toUpperCase()} with ${collateralAmount} $${collateralSymbol}...`);

    // Step 1: Approve
    const nonce = await this.manager.provider.getTransactionCount(this.manager.wallet.address, "pending");
    console.log(`⏳ Approving RWA Factory to spend ${collateralAmount} $${collateralSymbol}...`);
    const approveTx = await collateralToken.approve(this.manager.rwaFactoryContract.target, amount, { nonce });
    await approveTx.wait();
    console.log(`✅ Approved!`);

    // Step 2: Buy
    const nextNonce = nonce + 1;
    const buyTx = await this.manager.rwaFactoryContract.buyToken(tokenAddress, amount, { nonce: nextNonce });
    console.log(`⏳ Buy tx sent. Hash: ${buyTx.hash}. Waiting for confirmation...`);
    const receipt = await buyTx.wait();

    // Check new meme balance
    const memeToken = this.manager.getERC20(tokenAddress);
    const memeBalance = await memeToken.balanceOf(this.manager.wallet.address);

    return {
      txHash: buyTx.hash,
      memeBalance: ethers.formatEther(memeBalance)
    };
  }

  // ─── ORIGINAL: Buy memecoin with ETH via MockDEX ─────────────────────────
  public async buyToken(tokenSymbol: string, amountEth: string) {
    if (!this.manager.wallet || !this.manager.dexContract) {
      throw new Error("❌ Wallet or DEX contract not initialized. Check your PRIVATE_KEY and DEX_ADDRESS.");
    }

    const tokenAddress = this.manager.getTokenAddress(tokenSymbol);
    if (!tokenAddress) {
      throw new Error(`❌ Token "${tokenSymbol}" is not registered. You need to launch it first!`);
    }

    console.log(`💸 Buying $${tokenSymbol.toUpperCase()} with ${amountEth} ETH...`);
    
    const value = ethers.parseEther(amountEth);
    const nonce = await this.manager.provider.getTransactionCount(this.manager.wallet.address, "pending");
    const tx = await this.manager.dexContract.swapExactETHForTokens(tokenAddress, 0, { value, nonce });

    console.log(`⏳ Swap transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
    await tx.wait();
    
    const token = this.manager.getERC20(tokenAddress);
    const balance = await token.balanceOf(this.manager.wallet.address);

    return {
      txHash: tx.hash,
      balance: ethers.formatEther(balance)
    };
  }

  // ─── ORIGINAL: Sell memecoin for ETH via MockDEX ─────────────────────────
  public async sellToken(tokenSymbol: string, amountTokens: string) {
    if (!this.manager.wallet || !this.manager.dexContract) {
      throw new Error("❌ Wallet or DEX contract not initialized. Check your PRIVATE_KEY and DEX_ADDRESS.");
    }

    const tokenAddress = this.manager.getTokenAddress(tokenSymbol);
    if (!tokenAddress) {
      throw new Error(`❌ Token "${tokenSymbol}" is not registered.`);
    }

    console.log(`💸 Selling ${amountTokens} $${tokenSymbol.toUpperCase()} for ETH...`);

    const token = this.manager.getERC20(tokenAddress);
    const amount = ethers.parseEther(amountTokens);

    const balance = await token.balanceOf(this.manager.wallet.address);
    if (balance < amount) {
      throw new Error(`❌ Insufficient token balance. You have ${ethers.formatEther(balance)} $${tokenSymbol}.`);
    }

    const nonce = await this.manager.provider.getTransactionCount(this.manager.wallet.address, "pending");
    const approveTx = await token.approve(this.manager.dexContract.target, amount, { nonce });
    await approveTx.wait();

    const nextNonce = nonce + 1;
    const tx = await this.manager.dexContract.swapExactTokensForETH(tokenAddress, amount, 0, { nonce: nextNonce });
    
    console.log(`⏳ Swap transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
    await tx.wait();

    const ethBalance = await this.manager.provider.getBalance(this.manager.wallet.address);

    return {
      txHash: tx.hash,
      ethBalance: ethers.formatEther(ethBalance)
    };
  }
}
