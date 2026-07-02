import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const DB_PATH = path.join(__dirname, "../db.json");

// Known RWA Token Addresses on Robinhood Chain (poptye mainnet)
export const RWA_TOKENS: Record<string, string> = {
  "RDDT": "0x05b37Fb53A299a1b874A619e1c4C404D52C36F4C", // Reddit
  "UMC":  "0x0E6e67Ba88e7b5d9B67636A215c76779B948dE79", // United Microelectronics
  "WETH": "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73", // Wrapped ETH
};

// Minimal ABIs
export const FACTORY_ABI = [
  "function createToken(string name, string symbol) payable returns (address)",
  "function getDeployedTokens() view returns (address[])",
  "function getDeployedTokensCount() view returns (uint256)",
  "event TokenCreated(address indexed tokenAddress, string name, string symbol, address indexed creator, uint256 ethAmount)"
];

export const RWA_FACTORY_ABI = [
  "function launchToken(string name, string symbol, address collateralToken, uint256 targetCollateral) returns (address)",
  "function buyToken(address tokenAddress, uint256 collateralAmount)",
  "function getAllTokens() view returns (address[])",
  "function tokens(address) view returns (address creator, address collateralToken, uint256 targetCollateral, uint256 currentCollateral, bool completed, uint256 totalMemeSupply)",
  "event TokenLaunched(address indexed tokenAddress, address indexed creator, address collateralToken, uint256 targetCollateral)",
  "event TokenBought(address indexed tokenAddress, address indexed buyer, uint256 collateralAmount, uint256 memeAmount)",
  "event LiquidityAdded(address indexed tokenAddress, address poolAddress, uint256 tokenId, uint256 amount0, uint256 amount1)"
];

export const DEX_ABI = [
  "function addLiquidity(address token, uint256 tokenAmount) payable",
  "function swapExactETHForTokens(address token, uint256 minAmountOut) payable returns (uint256)",
  "function swapExactTokensForETH(address token, uint256 tokenAmount, uint256 minAmountOut) returns (uint256)",
  "function pools(address token) view returns (uint256 ethReserve, uint256 tokenReserve)",
  "event Swap(address indexed token, address indexed user, uint256 ethIn, uint256 tokenOut, uint256 tokenIn, uint256 ethOut)"
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export class BlockchainManager {
  public provider: ethers.JsonRpcProvider;
  public wallet: ethers.Wallet | null = null;
  public factoryContract: ethers.Contract | null = null;
  public rwaFactoryContract: ethers.Contract | null = null;
  public dexContract: ethers.Contract | null = null;
  public ethers = ethers;

  constructor() {
    const rpcUrl = process.env.RPC_URL || "https://rpc.testnet.chain.robinhood.com";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey && privateKey !== "your_private_key_here" && privateKey.trim() !== "") {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      const factoryAddress = process.env.FACTORY_ADDRESS;
      const rwaFactoryAddress = process.env.RWA_FACTORY_ADDRESS;
      const dexAddress = process.env.DEX_ADDRESS;

      if (factoryAddress && factoryAddress !== ethers.ZeroAddress) {
        this.factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, this.wallet);
      }
      if (rwaFactoryAddress && rwaFactoryAddress !== ethers.ZeroAddress) {
        this.rwaFactoryContract = new ethers.Contract(rwaFactoryAddress, RWA_FACTORY_ABI, this.wallet);
      }
      if (dexAddress && dexAddress !== ethers.ZeroAddress) {
        this.dexContract = new ethers.Contract(dexAddress, DEX_ABI, this.wallet);
      }
    } else {
      console.log("⚠️ Private key not set. Wallet operations will be read-only.");
    }
  }

  // Resolve RWA token address from symbol or raw address
  public resolveRWAToken(symbolOrAddress: string): string {
    if (symbolOrAddress.startsWith("0x")) return symbolOrAddress;
    const upper = symbolOrAddress.toUpperCase();
    const addr = RWA_TOKENS[upper];
    if (!addr) throw new Error(`❌ Unknown RWA token: "${symbolOrAddress}". Known: ${Object.keys(RWA_TOKENS).join(", ")}`);
    return addr;
  }

  // Registry Database management
  public loadRegistry(): Record<string, string> {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ tokens: {} }, null, 2));
    }
    try {
      const data = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(data);
      return parsed.tokens || {};
    } catch (e) {
      return {};
    }
  }

  public saveTokenToRegistry(symbol: string, address: string, collateralSymbol?: string): void {
    const tokens = this.loadRegistry();
    tokens[symbol.toUpperCase()] = address;
    const db = JSON.parse(fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH, "utf8") : "{}");
    db.tokens = tokens;
    if (collateralSymbol) {
      if (!db.rwa) db.rwa = {};
      db.rwa[symbol.toUpperCase()] = collateralSymbol.toUpperCase();
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }

  public getTokenAddress(symbol: string): string | null {
    const tokens = this.loadRegistry();
    return tokens[symbol.toUpperCase()] || null;
  }

  public getCollateralSymbol(memeSymbol: string): string | null {
    try {
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      return db.rwa?.[memeSymbol.toUpperCase()] || null;
    } catch {
      return null;
    }
  }

  public getERC20(address: string): ethers.Contract {
    const signerOrProvider = this.wallet || this.provider;
    return new ethers.Contract(address, ERC20_ABI, signerOrProvider);
  }
}
