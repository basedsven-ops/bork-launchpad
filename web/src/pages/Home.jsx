import React, { useState, useEffect } from 'react';
import { useActiveAccount, useSwitchActiveWalletChain } from 'thirdweb/react';
import { ethers6Adapter } from 'thirdweb/adapters/ethers6';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { client, robinhoodChain, FACTORY_ADDRESS, RWATokenFactoryABI, ERC20ABI, RWA_WHITELIST, TARGET_RAISE_USD } from '../config';

export default function Home() {
  const account = useActiveAccount();
  const switchChain = useSwitchActiveWalletChain();
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  
  const filteredTokens = tokens.filter(t => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (currentCategory !== "ALL" && t.category !== currentCategory) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "mcap") return parseFloat(b.marketCap.replace(/,/g, '')) - parseFloat(a.marketCap.replace(/,/g, ''));
    if (sortBy === "progress") {
      const progA = a.targetCollateral > 0 ? a.currentCollateral / a.targetCollateral : 0;
      const progB = b.targetCollateral > 0 ? b.currentCollateral / b.targetCollateral : 0;
      return progB - progA;
    }
    return 0; // newest defaults
  });
  useEffect(() => {
    async function fetchTokens() {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.mainnet.chain.robinhood.com");
        const factory = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, provider);
        const allTokenAddrs = await factory.getAllTokens();
        console.log("[BORK] getAllTokens returned:", allTokenAddrs);
        
        const tokenPromises = allTokenAddrs.map(async (addr) => {
          try {
            const info = await factory.tokens(addr);
            const memeContract = new ethers.Contract(addr, ERC20ABI, provider);
            
            // Parallelize on-chain calls for name/symbol
            const [tName, tSymbol] = await Promise.all([
              memeContract.name(),
              memeContract.symbol()
            ]);
            
            let tDesc = "";
            let tImg = "";
            let tWebsite = "";
            let tTwitter = "";
            let tTelegram = "";
            
            // Metadata fetch can fail without breaking the token listing
            try {
              if (info.tokenURI) {
                const ipfsUrl = info.tokenURI.replace("ipfs://", `https://${client.clientId}.ipfscdn.io/ipfs/`);
                const metaRes = await fetch(ipfsUrl);
                const metaJson = await metaRes.json();
                tDesc = metaJson.description || "";
                tImg = metaJson.image ? metaJson.image.replace("ipfs://", `https://${client.clientId}.ipfscdn.io/ipfs/`) : "";
                tWebsite = metaJson.website || "";
                tTwitter = metaJson.twitter || "";
                tTelegram = metaJson.telegram || "";
              }
            } catch (e) {
              console.error("[BORK] Failed to fetch IPFS metadata for", addr, e);
            }

            const collateralAsset = RWA_WHITELIST.find(a => a.address.toLowerCase() === info.collateralToken.toLowerCase()) || {};

            // Calculate Dynamic Market Cap
            let mcapUSD = "0";
            try {
              const vMeme = parseFloat(ethers.formatUnits(info.virtualMemeReserve, 18));
              const vCol = parseFloat(ethers.formatUnits(info.virtualCollateralReserve, 18));
              const ratio = vMeme > 0 ? (vCol / vMeme) : 0;
              const totalSupply = parseFloat(ethers.formatUnits(info.totalMemeSupply, 18));
              mcapUSD = (totalSupply * ratio * (collateralAsset.price || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 });
            } catch (e) {
              console.error("[BORK] Failed to calculate mcap for", addr, e);
            }

            return {
              id: addr,
              name: tName,
              symbol: tSymbol,
              collateralSymbol: collateralAsset.symbol || "UNK",
              targetCollateral: parseFloat(ethers.formatUnits(info.targetCollateral, 18)),
              currentCollateral: parseFloat(ethers.formatUnits(info.currentCollateral, 18)),
              completed: info.completed,
              priceChange: 0.0, 
              marketCap: mcapUSD, 
              category: collateralAsset.category || "Equities",
              creator: info.creator.substring(0, 6) + "..." + info.creator.substring(38),
              description: tDesc,
              image: tImg,
              website: tWebsite,
              twitter: tTwitter,
              telegram: tTelegram
            };
          } catch (tokenErr) {
            console.error("[BORK] Error fetching token", addr, tokenErr);
            return null;
          }
        });
        
        const fetchedTokens = (await Promise.all(tokenPromises)).filter(t => t !== null);
        console.log("[BORK] Fetched tokens:", fetchedTokens.length);
        fetchedTokens.reverse(); // Keep latest first
        
        setTokens(fetchedTokens);
      } catch (err) {
        console.error("[BORK] Error fetching on-chain tokens:", err);
      }
    }
    
    fetchTokens();
    const interval = setInterval(fetchTokens, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);
  
  // Launch Form State
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [collateralToken, setCollateralToken] = useState("RDDT");
  const [tokenDesc, setTokenDesc] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [devBuyEth, setDevBuyEth] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!logoFile) return alert("Please upload a logo");
    if (!account) return alert("Please connect wallet first");

    setIsSubmitting(true);
    setStatusMsg("Switching to Robinhood Chain in Wallet...");

    try {
      // Prompt wallet to switch network to Robinhood L2
      await switchChain(robinhoodChain);

      setStatusMsg("Uploading logo to IPFS...");
      const imgFormData = new FormData();
      imgFormData.append("file", logoFile);
      const imgRes = await fetch("https://storage.thirdweb.com/ipfs/upload", {
        method: "POST",
        headers: { "x-client-id": client.clientId },
        body: imgFormData
      });
      const imgData = await imgRes.json();
      const imageIpfsHash = imgData.IpfsHash;

      const asset = RWA_WHITELIST.find(a => a.symbol === collateralToken);
      const targetCollateral = parseFloat((TARGET_RAISE_USD / asset.price).toFixed(2));
      const description = tokenDesc.trim() || `Stock-backed memecoin launched on Robinhood L2 using $${collateralToken} collateral.`;
      
      const metadata = {
        name: tokenName,
        symbol: tokenSymbol.toUpperCase(),
        description,
        image: `ipfs://${imageIpfsHash}`,
        website: websiteUrl.trim(),
        twitter: twitterUrl.trim(),
        telegram: telegramUrl.trim()
      };

      const metaFormData = new FormData();
      const metaBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      metaFormData.append("file", metaBlob, "metadata.json");
      const metaRes = await fetch("https://storage.thirdweb.com/ipfs/upload", {
        method: "POST",
        headers: { "x-client-id": client.clientId },
        body: metaFormData
      });
      const metaData = await metaRes.json();
      const tokenURI = `ipfs://${metaData.IpfsHash}`;

      setStatusMsg("Please confirm transaction in Wallet...");
      
      const ethersSigner = await ethers6Adapter.signer.toEthers({
        client,
        chain: robinhoodChain,
        account,
      });

      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, ethersSigner);
      const targetWei = ethers.parseUnits(targetCollateral.toFixed(6), 18);

      const tx = await factoryContract.launchToken(
        tokenName,
        tokenSymbol.toUpperCase(),
        asset.address,
        targetWei,
        tokenURI
      );

      setStatusMsg("Waiting for launch tx confirmation...");
      const receipt = await tx.wait();

      // Find tokenAddress from event logs
      let tokenAddress = "";
      for (const log of receipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "TokenLaunched") {
            tokenAddress = parsedLog.args.tokenAddress;
            break;
          }
        } catch (e) {
          // ignore
        }
      }

      setStatusMsg("Token successfully launched!");
      
      setTokens(prev => [{
        id: tokenAddress || `user_${Date.now()}`,
        name: tokenName,
        symbol: tokenSymbol.toUpperCase(),
        collateralSymbol: collateralToken,
        targetCollateral: parseFloat((TARGET_RAISE_USD / asset.price).toFixed(2)),
        currentCollateral: 0,
        completed: false,
        priceChange: 0.0,
        marketCap: "4,200",
        category: asset.category,
        creator: account.address.substring(0, 6) + "..." + account.address.substring(38),
        description: description,
        image: `https://${client.clientId}.ipfscdn.io/ipfs/${imageIpfsHash}`,
        website: websiteUrl.trim(),
        twitter: twitterUrl.trim(),
        telegram: telegramUrl.trim()
      }, ...prev]);

      setTimeout(() => {
        setIsLaunchModalOpen(false);
        setIsSubmitting(false);
        setStatusMsg("");
        // Reset form fields
        setTokenName("");
        setTokenSymbol("");
        setTokenDesc("");
        setLogoFile(null);
        setPreviewUrl(null);
        setWebsiteUrl("");
        setTwitterUrl("");
        setTelegramUrl("");
      }, 2000);

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setIsSubmitting(false);
      setStatusMsg("");
    }
  };

  return (
    <>
      <section className="hero-split">
        <div className="hero-left">
          <button className="create-token-banner-btn" onClick={() => setIsLaunchModalOpen(true)}>
            ≫ Launch a Token ≪
          </button>
          <p className="hero-tagline">Launch stock-backed memecoins on Robinhood Chain L2. 100% fair launch, zero pre-mines, locked LP.</p>
          
          <div className="search-box-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search token name or ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-submit-btn">Search</button>
          </div>
        </div>
        
        <div className="hero-right stat-banner-panel">
          <div className="stat-banner-header">
            <span className="panel-badge">PROTOCOL RULES</span>
            <h3>Fair Launch Mechanics</h3>
          </div>
          <div className="stat-banner-body">
            <div className="bullet-point"><strong>$69,000 USD</strong> fixed graduation market cap.</div>
            <div className="bullet-point">Collects <strong>$13,800 USD</strong> worth of RWA token collateral (20%).</div>
            <div className="bullet-point">Automatic graduation to Uniswap V3 with 100% LP burned.</div>
          </div>
        </div>
      </section>

      <section className="filter-controls-section">
        <div className="tabs-row">
          <div className="filter-tabs">
            <button className={`tab-btn ${currentCategory === 'ALL' ? 'active' : ''}`} onClick={() => setCurrentCategory('ALL')}>All Tokens</button>
            <button className={`tab-btn ${currentCategory === 'RWA' ? 'active' : ''}`} onClick={() => setCurrentCategory('RWA')}>RWA Pairs</button>
            <button className={`tab-btn ${currentCategory === 'Crypto' ? 'active' : ''}`} onClick={() => setCurrentCategory('Crypto')}>Crypto Pairs</button>
          </div>
          <div className="sort-controls">
            <select className="control-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="mcap">Market Cap</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
      </section>

      <section className="tokens-grid-modern">
        {filteredTokens.length === 0 ? (
          <div style={{ color: 'var(--color-cloud)', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            No tokens found.
          </div>
        ) : (
          filteredTokens.map(token => {
            const progressPercent = token.targetCollateral > 0 ? ((token.currentCollateral / token.targetCollateral) * 100).toFixed(3) : 0;
            const isPositive = token.priceChange >= 0;
            const changeSymbol = isPositive ? "+" : "";

            return (
              <Link to={`/token/${token.id}`} key={token.id} style={{ textDecoration: 'none' }}>
                <div className={`token-card-compact ${token.completed ? 'graduated' : ''}`}>
                  
                  <div className="compact-left">
                    <div className="card-thumbnail-container-compact">
                      <img className="token-thumbnail-compact" src={token.image} alt={token.name} />
                      <span className="collateral-logo-badge-compact" title={`Backed by ${token.collateralSymbol}`}>${token.collateralSymbol}</span>
                    </div>
                  </div>

                  <div className="compact-right">
                    <div className="compact-title-row">
                      <h3>{token.name} <span className="compact-desc">{token.symbol}</span></h3>
                      <span className={`price-change-badge ${isPositive ? 'positive' : 'negative'}`}>
                        {changeSymbol}{token.priceChange.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="compact-badge-row">
                      <span className="category-tag-compact">Memecoin</span>
                      {token.website && <a href={token.website} target="_blank" rel="noopener noreferrer" className="compact-social-link" onClick={e=>e.stopPropagation()} title="Website">🌐</a>}
                      {token.twitter && <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="compact-social-link" onClick={e=>e.stopPropagation()} title="Twitter">🐦</a>}
                      {token.telegram && <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="compact-social-link" onClick={e=>e.stopPropagation()} title="Telegram">✈️</a>}
                    </div>

                    <div className="compact-stats-row">
                      <div className="compact-stat-col">
                        <span className="compact-label">created by:</span>
                        <span className="compact-creator-link" title="Creator address">{token.creator}</span>
                      </div>
                      <div className="compact-stat-col right-align">
                        <span className="compact-label">Market Cap:</span>
                        <span className="compact-value">${token.marketCap}</span>
                      </div>
                    </div>

                    <div className="compact-progress-row">
                      <div className="progress-bar-bg-compact">
                        <div className="progress-bar-fill-compact" style={{width: token.completed ? '100%' : progressPercent + '%'}}></div>
                      </div>
                      <span className="compact-percent">{token.completed ? '100%' : progressPercent + '%'}</span>
                    </div>
                  </div>
                  
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* Launch Modal */}
      {isLaunchModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsLaunchModalOpen(false)}>
          <div className="modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Launch a token</h2>
              <button className="close-btn" onClick={() => setIsLaunchModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleLaunch} className="launch-form-grid">
              
              <div className="form-scroll-area">
                <div className="form-row split-2">
                  <div className="form-group">
                    <label>SELECT DEX *</label>
                    <div className="selector-pills">
                      <button type="button" className="selector-pill active">Uniswap V3</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>SELECT PAIR TOKEN *</label>
                    <select value={collateralToken} onChange={e=>setCollateralToken(e.target.value)} required>
                      {RWA_WHITELIST.map(asset => (
                        <option key={asset.symbol} value={asset.symbol}>{asset.name} (${asset.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="config-panel">
                  <span className="panel-title">CONFIGURATION DETAILS</span>
                  <div className="config-row"><span>DEX:</span><span className="mono">Uniswap V3</span></div>
                  <div className="config-row"><span>Total Supply:</span><span className="mono">1,000,000,000</span></div>
                  <div className="config-row"><span>Graduation Market Cap:</span><span className="mono" style={{fontWeight: 700}}>$69,000 USD (Fixed)</span></div>
                  <div className="config-row">
                    <span>Target Collateral Needed:</span>
                    <span className="mono" style={{fontWeight: 700}}>
                      {parseFloat((TARGET_RAISE_USD / (RWA_WHITELIST.find(a => a.symbol === collateralToken)?.price || 1)).toFixed(2))} {collateralToken}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>LOGO IMAGE *</label>
                  <div className="image-upload-box" onClick={() => document.getElementById('fileInp').click()} style={previewUrl ? { borderColor: 'var(--color-obsidian)' } : {}}>
                    <input type="file" id="fileInp" hidden accept="image/*" onChange={handleFileChange} />
                    {previewUrl ? (
                      <img src={previewUrl} className="image-preview" style={{ display: 'inline-block' }} />
                    ) : (
                      <>
                        <div className="upload-icon">↑</div>
                        <div className="upload-text">Upload token logo</div>
                        <span className="upload-note">PNG, JPEG, WebP, or GIF</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-row split-2">
                  <div className="form-group">
                    <label>TOKEN NAME *</label>
                    <input type="text" value={tokenName} onChange={e=>setTokenName(e.target.value)} placeholder="e.g. Plasma Wizard" required />
                  </div>
                  <div className="form-group">
                    <label>SYMBOL *</label>
                    <input type="text" value={tokenSymbol} onChange={e=>setTokenSymbol(e.target.value)} placeholder="e.g. PLAS" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>DESCRIPTION</label>
                  <textarea value={tokenDesc} onChange={e=>setTokenDesc(e.target.value)} placeholder="Describe your token..." maxLength="256"></textarea>
                </div>

                <div className="form-row split-3" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label>WEBSITE (OPTIONAL)</label>
                    <input type="url" value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>TWITTER / X (OPTIONAL)</label>
                    <input type="url" value={twitterUrl} onChange={e=>setTwitterUrl(e.target.value)} placeholder="https://x.com/..." />
                  </div>
                  <div className="form-group">
                    <label>TELEGRAM (OPTIONAL)</label>
                    <input type="url" value={telegramUrl} onChange={e=>setTelegramUrl(e.target.value)} placeholder="https://t.me/..." />
                  </div>
                </div>


                <div className="launch-footer-panel">
                  <div className="fee-display">Launch fee: <span className="mono">0.0005 ETH</span></div>
                  <button type="submit" className="primary-cta launch-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? statusMsg : "Launch Token"}
                  </button>
                </div>
              </div>

              <div className="form-info-sidebar">
                <div className="info-block">
                  <h3>Required Fields</h3>
                  <ul>
                    <li>Launch configuration (DEX, Pair token)</li>
                    <li>Token name & symbol</li>
                    <li>Logo image (square, min 250×250)</li>
                  </ul>
                </div>
                
                <div className="info-block">
                  <h3>Fixed Pricing</h3>
                  <ul>
                    <li>Graduation Cap: $69,000 USD</li>
                    <li>Target amount matches asset market value</li>
                  </ul>
                </div>

                <div className="info-block bg-linen">
                  <h3>How it works</h3>
                  <ol>
                    <li>Select pair stock token</li>
                    <li>Upload logo & enter token details</li>
                    <li>Launch token with one transaction</li>
                    <li>Buy tokens immediately after launch</li>
                  </ol>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
