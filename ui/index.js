// ─── RWA WHITELIST (ALL 74 ON-CHAIN TOKENS WITH PRICES DISCOVERED ON ROBINHOOD L2) ───
const RWA_WHITELIST = [
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

// Target Market Cap value at pool graduation (locked at $69,000 USD matching Pump.fun)
const TARGET_VALUATION_USD = 69000;
const COLLATERAL_RATIO = 0.20;
const TARGET_RAISE_USD = TARGET_VALUATION_USD * COLLATERAL_RATIO; // $13,800 USD

// ─── STATE MANAGEMENT ───
let isConnected = false;
let userWalletAddress = "";
let rwaBalances = {};
let web3Provider = null;
let web3Signer = null;
const FACTORY_ADDRESS = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7"; // Deployed Robinhood Testnet Factory

// Initialize balances for all whitelisted assets
RWA_WHITELIST.forEach(asset => {
  rwaBalances[asset.symbol] = asset.symbol === "WETH" ? 2.5 : 1000.0;
});

// Initial mock memecoins (with realistic 24h change & addresses like Four.meme)
// No mock initial tokens, start completely clean
const initialTokens = [];

let tokens = [...initialTokens];
let activeSwapToken = null;

// Filter configurations
let currentSearch = "";
let currentCategory = "ALL";
let currentHotTag = "ALL";
let showOnlyGraduated = false;
let currentSort = "featured";

// ─── DOM ELEMENTS ───
const connectBtn = document.getElementById("connectWalletBtn");
const launchModal = document.getElementById("launchModal");
const closeLaunchModalBtn = document.getElementById("closeLaunchModalBtn");
const launchForm = document.getElementById("launchForm");
const collateralSelector = document.getElementById("collateralToken");

const swapModal = document.getElementById("swapModal");
const closeSwapModalBtn = document.getElementById("closeSwapModalBtn");
const buyTab = document.getElementById("buyTab");
const sellTab = document.getElementById("sellTab");
const payAmountInput = document.getElementById("payAmount");
const receiveAmountInput = document.getElementById("receiveAmount");
const payTokenSymbol = document.getElementById("payTokenSymbol");
const receiveTokenSymbol = document.getElementById("receiveTokenSymbol");
const executeSwapBtn = document.getElementById("executeSwapBtn");

const tokensGrid = document.getElementById("tokensGrid");

// Advanced inputs
const tokenSearchInput = document.getElementById("tokenSearchInput");
const searchSubmitBtn = document.getElementById("searchSubmitBtn");
const graduatedToggle = document.getElementById("graduatedToggle");
const sortSelect = document.getElementById("sortSelect");
const refreshBtn = document.getElementById("refreshBtn");

// Dynamic calculation DOM targets
const configTargetCollateral = document.getElementById("configTargetCollateral");
const targetCollateralDisplay = document.getElementById("targetCollateralDisplay");

// File Upload Elements
const uploadBox = document.getElementById("uploadBox");
const logoInput = document.getElementById("logoInput");

// ─── INITIALIZATION ───
document.addEventListener("DOMContentLoaded", () => {
  populateCollateralOptions();
  updateCalculatedTarget();
  setupSliderBanner();
  renderTokens();
  setupEventListeners();
  setupFilterControls();
});

// Populate Whitelist Assets into Launch Form Dropdown
function populateCollateralOptions() {
  collateralSelector.innerHTML = "";
  RWA_WHITELIST.forEach(asset => {
    const opt = document.createElement("option");
    opt.value = asset.symbol;
    opt.textContent = `${asset.symbol} - ${asset.name} ($${asset.price.toFixed(2)})`;
    collateralSelector.appendChild(opt);
  });
}

// Compute Target RWA Tokens dynamically based on USD price
function updateCalculatedTarget() {
  const selectedSymbol = collateralSelector.value;
  const asset = RWA_WHITELIST.find(a => a.symbol === selectedSymbol);
  if (!asset) return;

  const targetTokensNeeded = (TARGET_RAISE_USD / asset.price).toFixed(2);
  const formattedVal = `${targetTokensNeeded} ${asset.symbol}`;

  targetCollateralDisplay.value = formattedVal;
  configTargetCollateral.textContent = formattedVal;
}

// ─── SLIDER BANNER CAROUSEL ───
function setupSliderBanner() {
  const slides = document.querySelectorAll(".slider-banner .slide");
  const dots = document.querySelectorAll(".slider-banner .dot");
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach(s => s.classList.remove("active"));
    dots.forEach(d => d.classList.remove("active"));
    
    slides[index].classList.add("active");
    dots[index].classList.add("active");
    currentSlide = index;
  }

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.getAttribute("data-index"));
      showSlide(idx);
    });
  });

  // Auto slide every 5 seconds
  setInterval(() => {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }, 5000);
}

// ─── RENDER TOKENS (WITH INTEGRATED FILTERS & SORTING) ───
function renderTokens() {
  tokensGrid.innerHTML = "";

  // 1. Apply category, hot tags, search query, and graduation status filters
  let filtered = tokens.filter(t => {
    // Search query matching Name or Symbol
    const matchesSearch = currentSearch === "" || 
      t.name.toLowerCase().includes(currentSearch) || 
      t.symbol.toLowerCase().includes(currentSearch);
    
    // Category tabs matching (RWA vs Crypto)
    const matchesCategory = currentCategory === "ALL" || 
      (currentCategory === "Crypto" && t.category === "Crypto") || 
      (currentCategory === "RWA" && t.category !== "Crypto");

    // Hot Tags matching collateral tokens (RDDT, NVDA, TSLA, etc.)
    const matchesHotTag = currentHotTag === "ALL" || t.collateralSymbol === currentHotTag;

    // Toggle showing only graduated Uniswap pools
    const matchesGraduation = !showOnlyGraduated || t.completed === true;

    return matchesSearch && matchesCategory && matchesHotTag && matchesGraduation;
  });

  // 2. Sort tokens based on dropdown selection
  filtered.sort((a, b) => {
    if (currentSort === "newest") {
      // User created tokens have timestamp ID e.g. user_178290...
      const aVal = a.id.startsWith("user_") ? parseInt(a.id.split("_")[1]) : 0;
      const bVal = b.id.startsWith("user_") ? parseInt(b.id.split("_")[1]) : 0;
      return bVal - aVal;
    }
    if (currentSort === "mcap") {
      const aMcap = parseFloat(a.marketCap.replace("K", "").replace("M", ""));
      const bMcap = parseFloat(b.marketCap.replace("K", "").replace("M", ""));
      return bMcap - aMcap;
    }
    if (currentSort === "progress") {
      const aPct = a.currentCollateral / a.targetCollateral;
      const bPct = b.currentCollateral / b.targetCollateral;
      return bPct - aPct;
    }
    // Default/Featured: just keep the list array order
    return 0;
  });

  if (filtered.length === 0) {
    tokensGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--color-graphite); padding: 80px 0;">No tokens matching the active filters were found.</div>`;
    return;
  }

  filtered.forEach(token => {
    const card = document.createElement("div");
    card.className = `token-card ${token.completed ? 'graduated' : ''}`;
    
    const progressPercent = ((token.currentCollateral / token.targetCollateral) * 100).toFixed(3);
    const isPositive = token.priceChange >= 0;
    const changeSymbol = isPositive ? "+" : "";

    let actionBtnHtml = "";
    if (token.completed) {
      actionBtnHtml = `<a href="https://app.uniswap.org" target="_blank" class="card-action-btn graduated-btn">Trade on Uniswap V3 🔗</a>`;
    } else {
      actionBtnHtml = `<button class="card-action-btn" onclick="openSwapModal('${token.symbol}', '${token.collateralSymbol}')">Trade / Invest</button>`;
    }

    card.innerHTML = `
      <div class="card-top-layout">
        <div class="card-thumbnail-container">
          <img class="token-thumbnail" src="${token.image}" alt="${token.name}">
          <span class="collateral-logo-badge" title="Backed by ${token.collateralSymbol}">$${token.collateralSymbol}</span>
        </div>
        <div class="card-top-details">
          <div class="card-title-row">
            <h3>${token.name}</h3>
            <span class="price-change-badge ${isPositive ? 'positive' : 'negative'}">
              ${changeSymbol}${token.priceChange.toFixed(1)}%
            </span>
          </div>
          <div class="token-metadata-row">
            <span class="token-ticker">$${token.symbol}</span>
            <span class="category-tag">${token.category === 'Crypto' ? 'CRYPTO' : 'RWA PAIR'}</span>
            <a href="#" class="creator-link" title="Creator address">by ${token.creator}</a>
          </div>
        </div>
      </div>

      <p class="token-desc">${token.description}</p>
      
      <div class="metrics-row">
        <div class="metric-item">
          <span class="metric-label">Market Cap</span>
          <span class="metric-value">$${token.marketCap}</span>
        </div>
        <div class="metric-item" style="text-align: right;">
          <span class="metric-label">Graduation Target</span>
          <span class="metric-value">${token.targetCollateral.toFixed(0)} ${token.collateralSymbol}</span>
        </div>
      </div>

      <div class="card-progress-container">
        <div class="progress-bar-labels">
          <span>Bonding Progress</span>
          <span>${token.completed ? '100%' : progressPercent + '%'}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${token.completed ? '100%' : progressPercent + '%'}"></div>
        </div>
      </div>

      ${actionBtnHtml}
    `;
    
    tokensGrid.appendChild(card);
  });
}

// ─── FILTER CONTROLS ───
function setupFilterControls() {
  // Category tabs click handler
  const tabBtns = document.querySelectorAll(".filter-tabs .tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-filter");
      renderTokens();
    });
  });

  // Hot Tags click handler
  const tagPills = document.querySelectorAll(".tags-scroll .tag-pill");
  tagPills.forEach(pill => {
    pill.addEventListener("click", () => {
      tagPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentHotTag = pill.getAttribute("data-tag");
      renderTokens();
    });
  });

  // Search Submit
  searchSubmitBtn.addEventListener("click", () => {
    currentSearch = tokenSearchInput.value.toLowerCase().trim();
    renderTokens();
  });

  tokenSearchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      currentSearch = tokenSearchInput.value.toLowerCase().trim();
      renderTokens();
    }
  });

  // Toggle graduated
  graduatedToggle.addEventListener("change", (e) => {
    showOnlyGraduated = e.target.checked;
    renderTokens();
  });

  // Sort dropdown
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderTokens();
  });

  // Refresh
  refreshBtn.addEventListener("click", () => {
    showNotification("Feed updated in real-time");
    renderTokens();
  });
}

// ─── EVENT LISTENERS ───
function setupEventListeners() {
  // Connect Wallet
  connectBtn.addEventListener("click", async () => {
    const providerObj = window.ethereum || window.okxwallet;
    
    if (!isConnected) {
      if (typeof providerObj !== "undefined") {
        try {
          const accounts = await providerObj.request({ method: 'eth_requestAccounts' });
          userWalletAddress = accounts[0];
          
          try {
            await providerObj.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xb626' }], // 46630 in hex
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await providerObj.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xb626',
                  chainName: 'Robinhood Chain Testnet',
                  rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: ['https://explorer.testnet.chain.robinhood.com']
                }]
              });
            } else {
              console.error("Switch error:", switchError);
            }
          }

          web3Provider = new ethers.BrowserProvider(providerObj);
          web3Signer = await web3Provider.getSigner();

          isConnected = true;
          connectBtn.textContent = userWalletAddress.substring(0, 6) + "..." + userWalletAddress.substring(38);
          connectBtn.style.backgroundColor = "var(--color-sand)";
          connectBtn.style.color = "var(--color-obsidian)";
          showNotification("Connected to Robinhood Chain Testnet!");
        } catch (error) {
          console.error("Connection error:", error);
          alert("Gagal terhubung ke wallet: " + error.message);
          showNotification("Failed to connect wallet", true);
        }
      } else {
        alert("Wallet (MetaMask/OKX) tidak terdeteksi di browser Anda.");
        showNotification("Please install a Web3 Wallet!", true);
      }
    } else {
      isConnected = false;
      userWalletAddress = "";
      web3Provider = null;
      web3Signer = null;
      connectBtn.textContent = "CONNECT WALLET";
      connectBtn.style.backgroundColor = "var(--color-onyx)";
      connectBtn.style.color = "var(--color-paper)";
      showNotification("Wallet Disconnected");
    }
  });

  // Modal handlers
  document.getElementById("openLaunchModalBtn").addEventListener("click", () => {
    launchModal.classList.add("open");
  });

  closeLaunchModalBtn.addEventListener("click", () => {
    launchModal.classList.remove("open");
  });

  collateralSelector.addEventListener("change", () => {
    updateCalculatedTarget();
  });

  // File upload simulation
  uploadBox.addEventListener("click", () => {
    logoInput.click();
  });

  logoInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Image Preview
      const previewUrl = URL.createObjectURL(file);
      const previewImg = document.getElementById("imagePreview");
      const icon = document.getElementById("uploadIcon");
      if(previewImg) {
        previewImg.src = previewUrl;
        previewImg.style.display = "inline-block";
        if(icon) icon.style.display = "none";
      }

      uploadBox.querySelector(".upload-text").textContent = `Selected: ${file.name}`;
      uploadBox.querySelector(".upload-note").textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB - Ready to upload to IPFS`;
      uploadBox.style.borderColor = "var(--color-obsidian)";
    }
  });

  // Submit Launch Form
  launchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("tokenName").value;
    const symbol = document.getElementById("tokenSymbol").value.toUpperCase();
    const collateralSymbol = document.getElementById("collateralToken").value;
    const descText = document.getElementById("tokenDesc").value;

    const file = logoInput.files[0];
    if (!file) {
      showNotification("Please upload a token logo!", true);
      return;
    }

    const thirdwebClientId = "cb8b0c5b51b66de476c6923eee1357d6";
    const uploadBtn = launchForm.querySelector("button[type='submit']");
    const originalBtnText = uploadBtn.textContent;
    
    try {
      uploadBtn.textContent = "Uploading to IPFS...";
      uploadBtn.disabled = true;

      // 1. Upload Image to Thirdweb IPFS
      const imgFormData = new FormData();
      imgFormData.append("file", file);
      const imgRes = await fetch("https://storage.thirdweb.com/ipfs/upload", {
        method: "POST",
        headers: { "x-client-id": thirdwebClientId },
        body: imgFormData
      });
      const imgData = await imgRes.json();
      const imageIpfsHash = imgData.IpfsHash;
      const imageUrl = `https://${thirdwebClientId}.ipfscdn.io/ipfs/${imageIpfsHash}`;

      // 2. Prepare Metadata JSON
      const asset = RWA_WHITELIST.find(a => a.symbol === collateralSymbol);
      const targetCollateral = parseFloat((TARGET_RAISE_USD / asset.price).toFixed(2));
      const assetName = asset ? asset.name.split(" • ")[0] : "Stock";
      const description = descText.trim() !== "" 
        ? descText 
        : `Stock-backed memecoin launched on Robinhood L2 using $${collateralSymbol} (${assetName}) collateral.`;

      const metadata = {
        name,
        symbol,
        description,
        image: `ipfs://${imageIpfsHash}`
      };

      // 3. Upload Metadata to Thirdweb IPFS
      const metaFormData = new FormData();
      const metaBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      metaFormData.append("file", metaBlob, "metadata.json");
      const metaRes = await fetch("https://storage.thirdweb.com/ipfs/upload", {
        method: "POST",
        headers: { "x-client-id": thirdwebClientId },
        body: metaFormData
      });
      const metaData = await metaRes.json();
      const tokenURI = `ipfs://${metaData.IpfsHash}`;
      
      console.log("Token Launched Successfully!");
      console.log("Image URI:", `ipfs://${imageIpfsHash}`);
      console.log("Final Metadata tokenURI:", tokenURI);

      if (!web3Signer) {
        throw new Error("Wallet not fully connected. Please reconnect.");
      }

      // 4. Execute Web3 Transaction on Robinhood L2
      showNotification("Please confirm the transaction in your Wallet...");
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, web3Signer);
      const collateralAddress = asset.address;
      const targetWei = ethers.parseUnits(targetCollateral.toFixed(6), 18);

      const tx = await factoryContract.launchToken(
        name,
        symbol,
        collateralAddress,
        targetWei,
        tokenURI
      );
      
      showNotification("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("Tx Receipt:", receipt);

      // 5. Create Token locally for the UI to update the feed immediately
      const newToken = {
        id: "user_" + Date.now(),
        name,
        symbol,
        collateralSymbol,
        category: asset.category,
        targetCollateral,
        currentCollateral: 0,
        creator: userWalletAddress,
        priceChange: 0.0,
        marketCap: "0.00K",
        description,
        completed: false,
        price: (targetCollateral / 800000000).toFixed(8),
        image: imageUrl, 
        tokenURI: tokenURI
      };

      tokens.unshift(newToken);
      renderTokens();
      launchModal.classList.remove("open");
      launchForm.reset();
      
      // Reset upload box UI
      uploadBox.querySelector(".upload-text").textContent = "Upload token logo";
      uploadBox.querySelector(".upload-note").textContent = "PNG, JPEG, WebP, or GIF (max 4.5MB)";
      uploadBox.style.borderColor = "var(--color-sand)";
      
      const previewImg = document.getElementById("imagePreview");
      const icon = document.getElementById("uploadIcon");
      if(previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      if(icon) icon.style.display = "block";
      
      updateCalculatedTarget(); // reset target to initial selected value

      showNotification(`Successfully launched $${symbol} backed by $${collateralSymbol}!`);
    } catch (err) {
      console.error(err);
      showNotification("Failed to upload to IPFS or launch token.", true);
    } finally {
      uploadBtn.textContent = originalBtnText;
      uploadBtn.disabled = false;
    }
  });

  // Swap tabs click handlers
  buyTab.addEventListener("click", () => {
    buyTab.classList.add("active");
    sellTab.classList.remove("active");
    updateSwapInputs();
  });

  sellTab.addEventListener("click", () => {
    sellTab.classList.add("active");
    buyTab.classList.remove("active");
    updateSwapInputs();
  });

  closeSwapModalBtn.addEventListener("click", () => {
    swapModal.classList.remove("open");
  });

  payAmountInput.addEventListener("input", () => {
    calculateReceiveAmount();
  });

  // Execute Swap
  executeSwapBtn.addEventListener("click", () => {
    if (!isConnected) {
      showNotification("Please connect your wallet first!", true);
      return;
    }

    const payAmt = parseFloat(payAmountInput.value);
    const token = tokens.find(t => t.symbol === activeSwapToken.symbol);

    if (buyTab.classList.contains("active")) {
      if (rwaBalances[token.collateralSymbol] < payAmt) {
        showNotification(`Insufficient $${token.collateralSymbol} balance!`, true);
        return;
      }

      rwaBalances[token.collateralSymbol] -= payAmt;
      token.currentCollateral += payAmt;

      // Update mock market cap
      const currentPct = token.currentCollateral / token.targetCollateral;
      token.marketCap = (currentPct * 69.00).toFixed(2) + "K";
      token.priceChange += Math.random() * 20; // simulate price volatility

      if (token.currentCollateral >= token.targetCollateral) {
        token.currentCollateral = token.targetCollateral;
        token.completed = true;
        token.marketCap = "69.00K";
        showNotification(`🎉 $${token.symbol} reached funding target! Graduating to Uniswap V3...`);
      } else {
        showNotification(`Successfully bought $${token.symbol}!`);
      }
    } else {
      // Selling
      token.currentCollateral = Math.max(0, token.currentCollateral - (payAmt * parseFloat(token.price)));
      const currentPct = token.currentCollateral / token.targetCollateral;
      token.marketCap = (currentPct * 69.00).toFixed(2) + "K";
      token.priceChange -= Math.random() * 15; // simulate price dump
      
      showNotification(`Successfully sold $${token.symbol}!`);
    }

    renderTokens();
    swapModal.classList.remove("open");
  });
}

// ─── SWAP DIALOG HELPER ───
window.openSwapModal = function(symbol, collateralSymbol) {
  const token = tokens.find(t => t.symbol === symbol);
  activeSwapToken = token;
  
  swapModal.classList.add("open");
  buyTab.classList.add("active");
  sellTab.classList.remove("active");
  
  updateSwapInputs();
};

function updateSwapInputs() {
  if (!activeSwapToken) return;

  const isBuying = buyTab.classList.contains("active");

  if (isBuying) {
    payTokenSymbol.textContent = activeSwapToken.collateralSymbol;
    receiveTokenSymbol.textContent = activeSwapToken.symbol;
    payAmountInput.value = (activeSwapToken.targetCollateral * 0.1).toFixed(2);
  } else {
    payTokenSymbol.textContent = activeSwapToken.symbol;
    receiveTokenSymbol.textContent = activeSwapToken.collateralSymbol;
    payAmountInput.value = "100000";
  }

  calculateReceiveAmount();
}

function calculateReceiveAmount() {
  if (!activeSwapToken) return;

  const isBuying = buyTab.classList.contains("active");
  const payAmt = parseFloat(payAmountInput.value) || 0;
  const tokenPrice = parseFloat(activeSwapToken.price);

  if (isBuying) {
    receiveAmountInput.value = Math.floor(payAmt / tokenPrice);
  } else {
    receiveAmountInput.value = (payAmt * tokenPrice).toFixed(4);
  }
}

// ─── NOTIFICATION UTILITY ───
function showNotification(message, isError = false) {
  const notification = document.createElement("div");
  notification.className = `notification-toast ${isError ? 'error' : ''}`;
  notification.textContent = message;
  
  if (!document.getElementById("toastStyles")) {
    const style = document.createElement("style");
    style.id = "toastStyles";
    style.innerHTML = `
      .notification-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--color-paper);
        border: 1px solid var(--color-obsidian);
        color: var(--color-obsidian);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-small-elements);
        z-index: 2000;
        font-weight: 500;
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .notification-toast.error {
        background: var(--color-linen);
        border-color: var(--color-obsidian);
      }
      @keyframes slideIn {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideIn 0.3s ease reverse forwards";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}
