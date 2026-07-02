import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useActiveAccount } from 'thirdweb/react';
import { ethers6Adapter } from 'thirdweb/adapters/ethers6';
import { ethers } from 'ethers';
import { createChart } from 'lightweight-charts';
import { client, robinhoodChain, FACTORY_ADDRESS, RWATokenFactoryABI, ERC20ABI, RWA_WHITELIST, TARGET_RAISE_USD } from '../config';

export default function TokenDetail() {
  const { address } = useParams();
  const account = useActiveAccount();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trading State
  const [tradeMode, setTradeMode] = useState('buy'); // 'buy' or 'sell'
  const [payAmount, setPayAmount] = useState('');
  const [collateralBalance, setCollateralBalance] = useState("0.0");
  const [memeBalance, setMemeBalance] = useState("0.0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeStatus, setTradeStatus] = useState("");
  const [trades, setTrades] = useState([]);
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!token || !chartContainerRef.current) return;

    let chart;
    try {
      chart = createChart(chartContainerRef.current, {
        layout: { background: { type: 'solid', color: '#111216' }, textColor: '#d1d4dc' },
        grid: { vertLines: { color: '#2b2b43' }, horzLines: { color: '#2b2b43' } },
        width: chartContainerRef.current.clientWidth || 600,
        height: 500,
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      const series = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });

    const loadChartData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.testnet.chain.robinhood.com");
        const factory = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, provider);
        
        const filterBought = factory.filters.TokenBought(address);
        const filterSold = factory.filters.TokenSold(address);
        const boughtEvents = await factory.queryFilter(filterBought, 0, "latest");
        const soldEvents = await factory.queryFilter(filterSold, 0, "latest");
        const allEvents = [...boughtEvents, ...soldEvents].sort((a,b) => a.blockNumber - b.blockNumber || a.transactionIndex - b.transactionIndex);
        
        let dataMap = {};
        for(let ev of allEvents) {
          const blk = await ev.getBlock();
          const time = Math.floor(blk.timestamp / 60) * 60;
          let price = 0;
          if(ev.fragment.name === "TokenBought") {
            const cAmount = parseFloat(ethers.formatUnits(ev.args[2], 18));
            const mAmount = parseFloat(ethers.formatUnits(ev.args[3], 18));
            price = cAmount / mAmount;
          } else {
            const mAmount = parseFloat(ethers.formatUnits(ev.args[2], 18));
            const cAmount = parseFloat(ethers.formatUnits(ev.args[3], 18));
            price = cAmount / mAmount;
          }
          price = price * (RWA_WHITELIST.find(a=>a.address.toLowerCase() === token.collateralAddress.toLowerCase())?.price || 1);

          if (!dataMap[time]) {
              dataMap[time] = { time: time, open: price, high: price, low: price, close: price };
          } else {
              dataMap[time].high = Math.max(dataMap[time].high, price);
              dataMap[time].low = Math.min(dataMap[time].low, price);
              dataMap[time].close = price;
          }
        }
        
        let dataArr = Object.values(dataMap).sort((a,b)=>a.time - b.time);
        if(dataArr.length === 0) {
          const now = Math.floor(Date.now() / 1000);
          dataArr = [{time: now - 3600, open: 0.0001, high: 0.0001, low: 0.0001, close: 0.0001}];
        }
        series.setData(dataArr);

        // Process Trades for Feed
        const parsedTrades = await Promise.all(allEvents.map(async (ev) => {
          const blk = await ev.getBlock();
          const isBuy = ev.fragment.name === "TokenBought";
          const trader = isBuy ? ev.args[1] : ev.args[1];
          const memeAmt = parseFloat(ethers.formatUnits(isBuy ? ev.args[3] : ev.args[2], 18));
          const colAmt = parseFloat(ethers.formatUnits(isBuy ? ev.args[2] : ev.args[3], 18));
          return {
            id: ev.transactionHash,
            type: isBuy ? 'BUY' : 'SELL',
            trader: trader,
            memeAmount: memeAmt,
            colAmount: colAmt,
            timestamp: blk.timestamp
          };
        }));
        
        // Sort descending (newest first)
        parsedTrades.sort((a,b) => b.timestamp - a.timestamp);
        setTrades(parsedTrades);

      } catch (err) {
        console.error("Chart load err", err);
      }
    };
    loadChartData();

    } catch (e) {
      console.error("Chart init error", e);
    }

    return () => {
      if (chart) chart.remove();
    };
  }, [token, address]);

  const fetchTokenDetails = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://rpc.testnet.chain.robinhood.com");
      const factory = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, provider);
      const info = await factory.tokens(address);
      
      if (info.creator === ethers.ZeroAddress) {
        setLoading(false);
        return;
      }

      const memeContract = new ethers.Contract(address, ERC20ABI, provider);
      const tName = await memeContract.name();
      const tSymbol = await memeContract.symbol();
      
      let tDesc = "";
      let tImg = "";
      try {
        const ipfsUrl = info.tokenURI.replace("ipfs://", `https://${client.clientId}.ipfscdn.io/ipfs/`);
        const metaRes = await fetch(ipfsUrl);
        const metaJson = await metaRes.json();
        tDesc = metaJson.description || "";
        tImg = metaJson.image ? metaJson.image.replace("ipfs://", `https://${client.clientId}.ipfscdn.io/ipfs/`) : "";
      } catch (e) {
        console.error("Failed to fetch metadata", e);
      }

      const collateralAsset = RWA_WHITELIST.find(a => a.address.toLowerCase() === info.collateralToken.toLowerCase()) || {};

      // Dynamic Market Cap Calculation
      const vMeme = parseFloat(ethers.formatUnits(info.virtualMemeReserve, 18));
      const vCol = parseFloat(ethers.formatUnits(info.virtualCollateralReserve, 18));
      const ratio = vMeme > 0 ? (vCol / vMeme) : 0;
      const totalSupply = parseFloat(ethers.formatUnits(info.totalMemeSupply, 18));
      const mcapUSD = (totalSupply * ratio * (collateralAsset.price || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 });

      setToken({
        id: address,
        name: tName,
        symbol: tSymbol,
        collateralAddress: info.collateralToken,
        collateralSymbol: collateralAsset.symbol || "UNK",
        targetCollateral: parseFloat(ethers.formatUnits(info.targetCollateral, 18)),
        currentCollateral: parseFloat(ethers.formatUnits(info.currentCollateral, 18)),
        completed: info.completed,
        priceChange: 0.0,
        marketCap: mcapUSD, 
        category: collateralAsset.category || "Equities",
        creator: info.creator.substring(0, 6) + "..." + info.creator.substring(38),
        description: tDesc,
        image: tImg
      });

      // Fetch user balances if connected
      if (account) {
        try {
          const rwaContract = new ethers.Contract(info.collateralToken, ["function balanceOf(address) view returns (uint256)"], provider);
          const mContract = new ethers.Contract(address, ["function balanceOf(address) view returns (uint256)"], provider);
          
          const rwaBal = await rwaContract.balanceOf(account.address);
          const mBal = await mContract.balanceOf(account.address);
          
          setCollateralBalance(parseFloat(ethers.formatUnits(rwaBal, 18)).toFixed(4));
          setMemeBalance(parseFloat(ethers.formatUnits(mBal, 18)).toFixed(4));
        } catch (balErr) {
          console.warn("Failed to fetch user balances", balErr);
          // Fallback to 0.0 if the contract fails
          setCollateralBalance("0.0");
          setMemeBalance("0.0");
        }
      }

    } catch (err) {
      console.error("Error fetching details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenDetails();
    const interval = setInterval(fetchTokenDetails, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [address, account]);

  const handleTrade = async () => {
    if (!account) return alert("Please connect wallet first");
    if (!payAmount || parseFloat(payAmount) <= 0) return alert("Enter a valid amount");

    setIsSubmitting(true);
    setTradeStatus("Preparing transaction...");

    try {
      const ethersSigner = await ethers6Adapter.signer.toEthers({
        client,
        chain: robinhoodChain,
        account,
      });

      const amountWei = ethers.parseUnits(payAmount, 18);
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, ethersSigner);

      if (tradeMode === 'buy') {
        // Approve RWA token
        setTradeStatus("Approving RWA token...");
        const rwaContract = new ethers.Contract(token.collateralAddress, ["function approve(address, uint256) returns (bool)"], ethersSigner);
        const txApprove = await rwaContract.approve(FACTORY_ADDRESS, amountWei);
        await txApprove.wait();

        setTradeStatus("Executing Buy on AMM...");
        const txBuy = await factoryContract.buyToken(token.id, amountWei);
        await txBuy.wait();

      } else {
        // Approve MEME token
        setTradeStatus("Approving MEME token...");
        const memeContract = new ethers.Contract(token.id, ["function approve(address, uint256) returns (bool)"], ethersSigner);
        const txApprove = await memeContract.approve(FACTORY_ADDRESS, amountWei);
        await txApprove.wait();

        setTradeStatus("Executing Sell on AMM...");
        const txSell = await factoryContract.sellToken(token.id, amountWei);
        await txSell.wait();
      }

      setTradeStatus("Trade successful!");
      setPayAmount("");
      await fetchTokenDetails();

      setTimeout(() => {
        setTradeStatus("");
        setIsSubmitting(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      alert("Trade failed: " + err.message);
      setIsSubmitting(false);
      setTradeStatus("");
    }
  };

  if (loading) {
    return <div className="detail-loading">Loading Token Data...</div>;
  }

  if (!token) {
    return <div className="detail-loading">Token Not Found.</div>;
  }

  const progressPercent = token.targetCollateral > 0 ? ((token.currentCollateral / token.targetCollateral) * 100).toFixed(3) : 0;

  return (
    <div className="token-detail-page">
      <Link to="/" className="back-link">← Back to Launchpad</Link>

      <div className="detail-header-card">
        <div className="detail-img-wrapper">
          <img src={token.image} alt={token.name} className="detail-token-img" />
          <span className="detail-collateral-badge">${token.collateralSymbol}</span>
        </div>
        <div className="detail-header-info">
          <h1>{token.name} <span>${token.symbol}</span></h1>
          <div className="detail-badges">
            <span className="badge category">Memecoin</span>
            <span className="badge network">Robinhood L2</span>
          </div>
          <p className="detail-desc">{token.description}</p>
          <div className="detail-stats">
            <div className="stat-box">
              <span className="stat-label">Market Cap</span>
              <span className="stat-val">${token.marketCap}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Creator</span>
              <span className="stat-val mono">{token.creator}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-main-split">
        {/* LEFT COLUMN: Chart */}
        <div className="detail-left-col">
          <div 
            ref={chartContainerRef} 
            className="chart-container-native" 
            style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', marginBottom: '20px' }}
          ></div>

          <div className="recent-trades-container" style={{ background: 'var(--color-obsidian)', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--color-cloud)' }}>Recent Trades</h3>
            {trades.length === 0 ? (
              <p style={{ color: '#888' }}>No trades yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#888', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Type</th>
                    <th style={{ padding: '10px' }}>Maker</th>
                    <th style={{ padding: '10px' }}>Amount ({token.symbol})</th>
                    <th style={{ padding: '10px' }}>Cost ({token.collateralSymbol})</th>
                    <th style={{ padding: '10px' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '10px', color: t.type === 'BUY' ? '#26a69a' : '#ef5350', fontWeight: 'bold' }}>{t.type}</td>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{t.trader.substring(0,6)}...</td>
                      <td style={{ padding: '10px' }}>{t.memeAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                      <td style={{ padding: '10px' }}>{t.colAmount.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                      <td style={{ padding: '10px', color: '#888' }}>{new Date(t.timestamp * 1000).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Trade Panel & Bonding Curve */}
        <div className="detail-right-col">
          <div className="trade-panel-card">
            {token.completed ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ color: 'var(--color-neon-blue)', marginBottom: '10px' }}>🎉 Token Graduated!</h3>
                <p style={{ color: 'var(--color-cloud)', marginBottom: '20px', fontSize: '14px' }}>
                  The bonding curve has been completed. All liquidity is now securely locked in Uniswap V3.
                </p>
                <a 
                  href={`https://app.uniswap.org/#/swap?outputCurrency=${token.id}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ display: 'block', padding: '15px', backgroundColor: 'var(--color-neon-blue)', color: '#000', borderRadius: '8px', fontWeight: '700', textDecoration: 'none' }}
                >
                  Trade on Uniswap
                </a>
              </div>
            ) : (
              <>
                <div className="trade-tabs">
                  <button className={`trade-tab ${tradeMode === 'buy' ? 'buy-active' : ''}`} onClick={() => setTradeMode('buy')}>Buy</button>
                  <button className={`trade-tab ${tradeMode === 'sell' ? 'sell-active' : ''}`} onClick={() => setTradeMode('sell')}>Sell</button>
                </div>
                
                <div className="trade-input-wrapper">
                  <div className="trade-input-header">
                    <span>Amount</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => setPayAmount(tradeMode === 'buy' ? collateralBalance : memeBalance)}>
                      Balance: {tradeMode === 'buy' ? collateralBalance : memeBalance} {tradeMode === 'buy' ? token.collateralSymbol : token.symbol}
                    </span>
                  </div>
                  <div className="trade-input-row">
                    <input 
                      type="number" 
                      placeholder="0.0" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                    <div className="trade-currency-badge">
                      {tradeMode === 'buy' ? token.collateralSymbol : token.symbol}
                    </div>
                  </div>
                </div>

                <button 
                  className={`trade-submit-btn ${tradeMode}`} 
                  onClick={handleTrade}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (tradeStatus || "Processing...") : 
                   tradeMode === 'buy' ? 'Place Trade (Buy)' : 'Place Trade (Sell)'}
                </button>
              </>
            )}
          </div>

          <div className="bonding-curve-panel">
            <h3>Bonding Curve Progress</h3>
            <div className="bonding-bar-bg">
              <div className="bonding-bar-fill" style={{ width: token.completed ? '100%' : `${progressPercent}%`}}></div>
            </div>
            <div className="bonding-stats">
              <span>{token.completed ? '100%' : `${progressPercent}%`}</span>
              <span>{token.currentCollateral.toFixed(2)} / {token.targetCollateral.toFixed(2)} {token.collateralSymbol}</span>
            </div>
            <p className="bonding-desc">
              When the market cap reaches <strong>$69,000 USD</strong>, all the liquidity from the bonding curve will be deposited into Uniswap V3 and locked forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
