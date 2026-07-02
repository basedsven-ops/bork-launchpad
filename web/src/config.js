import { createThirdwebClient, defineChain } from 'thirdweb';

export const client = createThirdwebClient({
  clientId: "cb8b0c5b51b66de476c6923eee1357d6", 
});

export const robinhoodChain = defineChain({
  id: 4663,
  rpc: "https://rpc.mainnet.chain.robinhood.com",
});

export const TARGET_RAISE_USD = 13800; // 20% of 69k
export const FACTORY_ADDRESS = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7";
export const ZAPPER_ADDRESS = "0x8107b108bB6deb88a76632FA5d7372013e047eE6";

export const FACTORY_ABI = [
  "function launchToken(string name, string symbol, address collateralToken, uint256 targetCollateral, string tokenURI) external returns (address)",
  "function getAllTokens() external view returns (address[])",
  "function tokens(address) external view returns (address creator, address collateralToken, uint256 targetCollateral, uint256 currentCollateral, uint256 memeSold, bool completed, uint256 totalMemeSupply, string tokenURI, uint256 virtualMemeReserve, uint256 virtualCollateralReserve)",
  "function buyToken(address tokenAddress, uint256 collateralAmount) external",
  "function sellToken(address tokenAddress, uint256 memeAmount) external",
  "function getBuyPrice(address tokenAddress, uint256 collateralAmount) public view returns (uint256 memeOut)",
  "function getSellPrice(address tokenAddress, uint256 memeAmount) public view returns (uint256 collateralOut)",
  "event TokenLaunched(address indexed tokenAddress, address indexed creator, address collateralToken, uint256 targetCollateral, string tokenURI)",
  "event TokenBought(address indexed tokenAddress, address indexed buyer, uint256 collateralAmount, uint256 memeAmount)",
  "event TokenSold(address indexed tokenAddress, address indexed seller, uint256 memeAmount, uint256 collateralAmount)"
];

// Alias for backwards compatibility if needed
export const RWATokenFactoryABI = FACTORY_ABI;

export const ZAPPER_ABI = [
  "function zapBuy(address memeToken, address collateralToken, uint24 poolFee, int24 tickSpacing) external payable"
];

export const ERC20ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

export const RWA_WHITELIST = [
  { symbol: "RDDT", name: "Reddit Inc.", address: "0x05b37Fb53A299a1b874A619e1c4C404D52C36F4C", category: "Equities", price: 62.45 },
  { symbol: "WETH", name: "Wrapped Ethereum", address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73", category: "Crypto", price: 3450.00 },
  { symbol: "NOW", name: "ServiceNow Inc.", address: "0x0C3260aF4B8f13a69c4c2dFb84fD667890CDFa14", category: "Equities", price: 780.00 },
  { symbol: "UMC", name: "United Microelectronics", address: "0x0E6e67Ba88e7b5d9B67636A215c76779B948dE79", category: "Equities", price: 7.82 },
  { symbol: "QCOM", name: "Qualcomm Inc.", address: "0x0f17206447090e464C277571124dD2688E48AEA9", category: "Equities", price: 172.50 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", category: "ETFs", price: 545.00 },
  { symbol: "AMZN", name: "Amazon.com Inc.", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", category: "Equities", price: 185.00 },
  { symbol: "AVGO", name: "Broadcom Inc.", address: "0x156E175DD063a8cE274C50654eF40e0032b3fbcF", category: "Equities", price: 1420.00 },
  { symbol: "XLK", name: "Technology Select Sector SPDR ETF", address: "0x15Cd20759CE7F3285c29A319dE2D1A2e098c6f43", category: "ETFs", price: 225.00 },
  { symbol: "ASTS", name: "AST SpaceMobile", address: "0x1AF6446f07eb1d97c546AFC8c9544cBDF3AD5137", category: "Equities", price: 24.50 },
  { symbol: "P", name: "Everpure Inc.", address: "0x1Cdad396DB64BDa184d5182A97Dd9B3C62100b7D", category: "Equities", price: 18.20 },
  { symbol: "GME", name: "GameStop Corp.", address: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E", category: "Equities", price: 22.50 },
  { symbol: "sUSDe", name: "Staked USDe", address: "0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2", category: "Crypto", price: 1.00 },
  { symbol: "F", name: "Ford Motor Company", address: "0x25C288E6D899b9BC30160965aD9644c67e73bE0C", category: "Equities", price: 12.10 },
  { symbol: "NOK", name: "Nokia Corp.", address: "0x25EE805ac369b6E3F8bF5764c682d34a37cb7175", category: "Equities", price: 4.20 },
  { symbol: "DDOG", name: "Datadog Inc.", address: "0x27c99fBde9D0d2AA4f4Bfb4943f237843DdF6958", category: "Equities", price: 118.00 },
  { symbol: "FLNC", name: "Fluence Energy", address: "0x282e87451E10fA6679BC7D76C69BE44cD3fC777C", category: "Equities", price: 19.50 },
  { symbol: "RGTI", name: "Rigetti Computing", address: "0x284358abc07F9359f19f4b5b4aC91901Be2597Ba", category: "Equities", price: 1.80 },
  { symbol: "wstETH", name: "Wrapped Liquid Staked Ether 2.0", address: "0x2dC99af320BC317c567f24eE95811dcbd5983DfD", category: "Crypto", price: 4120.00 },
  { symbol: "GOOGL", name: "Alphabet Class A", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", category: "Equities", price: 178.00 },
  { symbol: "TSLA", name: "Tesla Inc.", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", category: "Equities", price: 220.50 },
  { symbol: "DRAM", name: "Roundhill Memory ETF", address: "0x33C18e2CC8AE9AE486e785090D86B2CE632FF994", category: "ETFs", price: 50.00 },
  { symbol: "AMAT", name: "Applied Materials", address: "0x36046893810a7E7fCE501229d57dc3FC8c8716d0", category: "Equities", price: 218.00 },
  { symbol: "ELF", name: "e.l.f. Beauty Inc.", address: "0x39EC44Bee4F6A116c6F9B8De566848a985C53C60", category: "Equities", price: 165.00 },
  { symbol: "RKLB", name: "Rocket Lab Corporation", address: "0x3b14C39E89D60D627b42a1A4CA45b5bb45Fc12e2", category: "Equities", price: 11.20 },
  { symbol: "syrupUSDG", name: "syrupUSDG Savings", address: "0x40858070814a57FdF33a613ae84fE0a8b4a874f7", category: "Crypto", price: 1.00 },
  { symbol: "NU", name: "Nu Holdings Ltd.", address: "0x408c14038a04f7bD235329E26d2bf569ee20e250", category: "Equities", price: 14.80 },
  { symbol: "SLV", name: "iShares Silver Trust", address: "0x411eFb0E7f985935DAec3D4C3ebaEa0d0AD7D89f", category: "Commodities", price: 26.50 },
  { symbol: "PR", name: "Permian Resources", address: "0x4189F0c66EBBB0bfeF1C31f763131361EF32f77C", category: "Equities", price: 15.20 },
  { symbol: "ZM", name: "Zoom Video Communications", address: "0x44c4F142009036cF477eD2d09932051843137CF1", category: "Equities", price: 58.50 },
  { symbol: "ASML", name: "ASML Holding NV", address: "0x47F93d52cBeC7C6D2CfC080e154002370a60dAEA", category: "Equities", price: 890.00 },
  { symbol: "MXL", name: "MaxLinear Inc.", address: "0x48961813349333209994750ffA89b3c5C22eC969", category: "Equities", price: 21.00 },
  { symbol: "BA", name: "Boeing Company", address: "0x4D21483a44Bf67a86b77E3dA301411880797D452", category: "Equities", price: 178.00 },
  { symbol: "COST", name: "Costco Wholesale Corp.", address: "0x4EA005168D7F09a7A0Ba9D1DEf21a479950E44C2", category: "Equities", price: 840.00 },
  { symbol: "LULU", name: "Lululemon Athletica", address: "0x4e62068525Ab11FE768e29dfD00ef909B9803016", category: "Equities", price: 312.00 },
  { symbol: "AAOI", name: "Applied Optoelectronics", address: "0x521Cf887E6531c6F667b5BC4D896E5d9bfE8EB2E", category: "Equities", price: 11.50 },
  { symbol: "AMD", name: "Advanced Micro Devices", address: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC", category: "Equities", price: 162.00 },
  { symbol: "PLTR", name: "Palantir Technologies", address: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A", category: "Equities", price: 25.80 },
  { symbol: "TSEM", name: "Tower Semiconductor", address: "0x89776d4Cd68193597A2fC132cfaC1fDe36CCeA8a", category: "Equities", price: 32.40 },
  { symbol: "CELH", name: "Celsius Holdings", address: "0x8cF07C5A878945185d327aAa6e33FAa95F95e7bF", category: "Equities", price: 54.20 },
  { symbol: "LITE", name: "Lumentum Holdings", address: "0x8eF20885F94e3D9bc7eB3080279188Bd5ED7c08C", category: "Equities", price: 44.50 },
  { symbol: "RDW", name: "Redwire Space", address: "0x92Ef19E82bD8fF36661DE838D5eaE7e5CEF0EfFE", category: "Equities", price: 7.20 },
  { symbol: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF", address: "0x92FD66527192E3e61d4DDd13322Aa222DE86F9B5", category: "ETFs", price: 100.00 },
  { symbol: "DELL", name: "Dell Technologies", address: "0x941AE714EC6D8130c7B75d67160Ca08f1e7d11Dd", category: "Equities", price: 132.00 },
  { symbol: "SATS", name: "EchoStar Corp.", address: "0x95052ddcd5DC25641657424A8Cf04834997E1730", category: "Equities", price: 16.50 },
  { symbol: "CCL", name: "Carnival Corp.", address: "0x9651342CeA770aE9a2969Ba2A52611523146aef9", category: "Equities", price: 17.50 },
  { symbol: "SOFI", name: "SoFi Technologies", address: "0x98E75885157C80992A8D41b696D8c9C6Fb30A926", category: "Equities", price: 7.25 },
  { symbol: "NBIS", name: "Nebius Group", address: "0x9D9c6684F596F66a64C030B93A886D51Fd4D7931", category: "Equities", price: 18.00 },
  { symbol: "PENG", name: "Penguin Solutions", address: "0x9b23573b156B52565012F5cE02CDF60AFBaa70Be", category: "Equities", price: 19.20 },
  { symbol: "XNDU", name: "Xanadu Quantum", address: "0xA8eB3BCcbf2017eE7CBfb652eB51CF2E1B153289", category: "Equities", price: 50.00 },
  { symbol: "SPMO", name: "Invesco S&P 500 Momentum ETF", address: "0xAd622320e520de39e72d41EF07438C3Fd3354875", category: "ETFs", price: 78.00 },
  { symbol: "RIVN", name: "Rivian Automotive", address: "0xB1BF26c1D20ff267A4f93550d1E0d06ac40a114B", category: "Equities", price: 14.50 },
  { symbol: "SNDK", name: "SanDisk Corp.", address: "0xB90A19fF0Af67f7779afF50A882A9CfF42446400", category: "Equities", price: 80.00 },
  { symbol: "NNE", name: "Nano Nuclear Energy", address: "0xBEF75684C43c4ea7BD18Dd532a2244674Ee8b926", category: "Equities", price: 12.80 },
  { symbol: "QBTS", name: "D-Wave Quantum Inc.", address: "0xC583c60aeF9Dc401Da72cEC1B404743a93cea1Cc", category: "Equities", price: 1.50 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68", category: "ETFs", price: 475.00 },
  { symbol: "MDB", name: "MongoDB Inc.", address: "0xDdf2266b79abf0B48898959B0ed6E6adf512be74", category: "Equities", price: 290.00 },
  { symbol: "NFLX", name: "Netflix Inc.", address: "0xE0444EF8BF4eD74f74FD73686e2ddF4C1c5591E8", category: "Equities", price: 680.00 },
  { symbol: "IREN", name: "IREN Limited", address: "0xF0AB0c93bE6F41369d302e55db1A96b3c430212D", category: "Equities", price: 9.50 },
  { symbol: "RBLX", name: "Roblox Corp.", address: "0xF0C4BF4C582cb3836e98394b1d4e7B7281101bE8", category: "Equities", price: 38.00 },
  { symbol: "SHOP", name: "Shopify Inc.", address: "0xF53F66751B1Eff985311b693531E3290F600c410", category: "Equities", price: 64.50 },
  { symbol: "USO", name: "United States Oil Fund", address: "0xa30FA36Db767ad9eD3f7a60fC79526fB4d56D344", category: "Commodities", price: 78.50 },
  { symbol: "LUNR", name: "Intuitive Machines", address: "0xa5D4968421bA94814Be3B136b15cf422101aC1a3", category: "Equities", price: 8.40 },
  { symbol: "AAPL", name: "Apple Inc.", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", category: "Equities", price: 212.00 },
  { symbol: "BABA", name: "Alibaba Group Holding", address: "0xad25Ac6C84D497db898fa1E8387bf6Af3532a1c4", category: "Equities", price: 75.00 },
  { symbol: "ORCL", name: "Oracle Corp.", address: "0xb0992820E760d836549ba69BC7598b4af75dEE03", category: "Equities", price: 138.00 },
  { symbol: "APLD", name: "Applied Digital Corp.", address: "0xb8DBf92F9741c9ac1c32115E78581f23509916FD", category: "Equities", price: 6.20 },
  { symbol: "NVTS", name: "Navitas Semiconductor", address: "0xbE6702d7b70315376dC48a3293f24f0982F86386", category: "Equities", price: 3.80 },
  { symbol: "SMCI", name: "Super Micro Computer", address: "0xc01aA1fECeC0605b13bc84874ff7256C0f5F562a", category: "Equities", price: 820.00 },
  { symbol: "META", name: "Meta Platforms Inc.", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", category: "Equities", price: 504.00 },
  { symbol: "INTC", name: "Intel Corp.", address: "0xc72b96e0E48ecd4DC75E1e45396e26300BC39681", category: "Equities", price: 30.50 },
  { symbol: "CLSK", name: "CleanSpark Inc.", address: "0xcBB95BBF36099d34dA091dc6Fa6F49EfA257Cee3", category: "Equities", price: 16.50 },
  { symbol: "POET", name: "POET Technologies", address: "0xcf6B2D875361be807EAfa57458c80f28521F9333", category: "Equities", price: 3.20 },
  { symbol: "NVDA", name: "NVIDIA Corp.", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", category: "Equities", price: 125.00 },
  { symbol: "USAR", name: "USA Rare Earth", address: "0xd917B029C761D264c6A312BBbcDA868658eF86a6", category: "Commodities", price: 5.00 },
  { symbol: "CRCL", name: "Circle Internet Group", address: "0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5", category: "Crypto", price: 1.00 },
  { symbol: "MSFT", name: "Microsoft Corp.", address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", category: "Equities", price: 420.00 },
  { symbol: "FUTU", name: "Futu Holdings Ltd.", address: "0xeB30663bDFf0622Ef4e4E5cBb4E975F19f33f51D", category: "Equities", price: 82.00 },
  { symbol: "MSTR", name: "MicroStrategy Inc.", address: "0xec262a75e413fAfD0dF80480274532C79D42da09", category: "Equities", price: 1620.00 },
  { symbol: "INOD", name: "Innodata Inc.", address: "0xf1953DAB6FaD537488d5A022361FfAa8B4c95eC6", category: "Equities", price: 14.50 },
  { symbol: "UPS", name: "United Parcel Service", address: "0xf23250dac154D05Bb671CB0d0eBEf3c635c79CE2", category: "Equities", price: 142.00 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", address: "0xf9B46d3D1B22199D4D1025a9cEDB540A33F1a2d5", category: "Equities", price: 114.00 },
  { symbol: "MU", name: "Micron Technology", address: "0xfF080c8ce2E5feadaCa0Da81314Ae59D232d4afD", category: "Equities", price: 132.00 }
];
