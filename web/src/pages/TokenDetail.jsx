import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useActiveAccount } from 'thirdweb/react';
import { ethers6Adapter } from 'thirdweb/adapters/ethers6';
import { ethers } from 'ethers';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { client, robinhoodChain, FACTORY_ADDRESS, RWATokenFactoryABI, ERC20ABI, RWA_WHITELIST, TARGET_RAISE_USD, ZAPPER_ADDRESS, ZAPPER_ABI } from '../config';

export default function TokenDetail() {
  const { address } = useParams();
  const account = useActiveAccount();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trading State
  const [tradeMode, setTradeMode] = useState('buy'); // 'buy' or 'sell'
  const [payAmount, setPayAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [collateralBalance, setCollateralBalance] = useState("0.0");
  const [memeBalance, setMemeBalance] = useState("0.0");
  const [exactCollateralBalance, setExactCollateralBalance] = useState("0.0");
  const [exactMemeBalance, setExactMemeBalance] = useState("0.0");
  const [chartError, setChartError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeStatus, setTradeStatus] = useState("");
  const [trades, setTrades] = useState([]);
  const [timeframe, setTimeframe] = useState('5m');
  const chartContainerRef = useRef();

  // Fetch trade history and update chart with timeframe and volume support
  useEffect(() => {
    if (loading || !token) return;

    let chart;
    let series;
    let volumeSeries;
    let pollInterval;
    let ro;
    let cancelled = false;

    // Timeframe duration in seconds
    let duration = 300;
    if (timeframe === '1m') duration = 60;
    else if (timeframe === '5m') duration = 300;
    else if (timeframe === '15m') duration = 900;
    else if (timeframe === '1h') duration = 3600;
    else if (timeframe === '24h') duration = 86400;

    // Calculate adaptive price formatting options based on initial token price
    const collateralAsset = RWA_WHITELIST.find(
      a => a.address.toLowerCase() === token.collateralAddress.toLowerCase()
    ) || {};
    const vCol = (token.targetCollateral * 273) / 800;
    const vMeme = 1073000000;
    const launchPrice = (vCol / vMeme) * (collateralAsset.price || 1);

    const precision = launchPrice < 0.00001 ? 10 : (launchPrice < 0.01 ? 6 : 4);
    const minMove = parseFloat(Math.pow(10, -precision).toFixed(precision));

    const loadData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.mainnet.chain.robinhood.com");
        const factory = new ethers.Contract(FACTORY_ADDRESS, RWATokenFactoryABI, provider);

        const [boughtEvents, soldEvents] = await Promise.all([
          factory.queryFilter(factory.filters.TokenBought(address), 0, "latest"),
          factory.queryFilter(factory.filters.TokenSold(address), 0, "latest")
        ]);
        const allEvents = [...boughtEvents, ...soldEvents].sort(
          (a, b) => a.blockNumber - b.blockNumber || a.transactionIndex - b.transactionIndex
        );

        const info = await factory.tokens(address);
        const collateralAsset = RWA_WHITELIST.find(
          a => a.address.toLowerCase() === info.collateralToken.toLowerCase()
        ) || {};

        // 1. Process Trades for Feed
        const parsedTrades = await Promise.all(allEvents.map(async ev => {
          const blk = await ev.getBlock();
          const isBuy = ev.eventName === "TokenBought";
          return {
            id: ev.transactionHash,
            type: isBuy ? 'BUY' : 'SELL',
            trader: isBuy ? ev.args.buyer : ev.args.seller,
            memeAmount: parseFloat(ethers.formatUnits(ev.args.memeAmount, 18)),
            colAmount: parseFloat(ethers.formatUnits(ev.args.collateralAmount, 18)),
            timestamp: blk.timestamp
          };
        }));
        parsedTrades.sort((a, b) => b.timestamp - a.timestamp);
        if (!cancelled) setTrades(parsedTrades);

        // 2. Build OHLC & Volume Candle Data (only for local chart)
        if (!token.completed && series) {
          const dataMap = {};
          for (const ev of allEvents) {
            const blk = await ev.getBlock();
            const time = Math.floor(blk.timestamp / duration) * duration;
            const cAmount = parseFloat(ethers.formatUnits(ev.args.collateralAmount, 18));
            const mAmount = parseFloat(ethers.formatUnits(ev.args.memeAmount, 18));
            const price = (mAmount > 0 ? (cAmount / mAmount) : 0) * (collateralAsset.price || 1);
            const isBuy = ev.eventName === "TokenBought";

            if (!dataMap[time]) {
              dataMap[time] = { time, open: price, high: price, low: price, close: price, volume: mAmount };
            } else {
              dataMap[time].high = Math.max(dataMap[time].high, price);
              dataMap[time].low  = Math.min(dataMap[time].low,  price);
              dataMap[time].close = price;
              dataMap[time].volume += mAmount;
            }
          }

          // Calculate dynamic initial launch price
          const targetCol = parseFloat(ethers.formatUnits(info.targetCollateral, 18));
          const vCol = (targetCol * 273) / 800;
          const vMeme = 1073000000;
          const launchPrice = (vCol / vMeme) * (collateralAsset.price || 1);

          let dataArr = Object.values(dataMap).sort((a, b) => a.time - b.time);
          if (dataArr.length > 0) {
            const firstTradeTime = dataArr[0].time;
            const launchCandle = {
              time: firstTradeTime - duration,
              open: launchPrice,
              high: launchPrice,
              low: launchPrice,
              close: launchPrice,
              volume: 0
            };
            // Set the first candle's open/low/high properly relative to the launch price
            dataArr[0].open = launchPrice;
            if (dataArr[0].low > launchPrice) dataArr[0].low = launchPrice;
            if (dataArr[0].high < launchPrice) dataArr[0].high = launchPrice;

            dataArr = [launchCandle, ...dataArr];
          } else {
            const now = Math.floor(Date.now() / 1000 / duration) * duration;
            dataArr = [
              { time: now - duration, open: launchPrice, high: launchPrice, low: launchPrice, close: launchPrice, volume: 0 },
              { time: now, open: launchPrice, high: launchPrice, low: launchPrice, close: launchPrice, volume: 0 }
            ];
          }

          if (series && !cancelled) series.setData(dataArr);

          // Build and set volume series data
          if (volumeSeries && !cancelled) {
            const volumeData = dataArr.map(d => ({
              time: d.time,
              value: d.volume,
              color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            }));
            volumeSeries.setData(volumeData);
          }
        }

        if (!cancelled) setChartError("");
      } catch (err) {
        console.error("Trades/Chart loading error:", err);
        if (!cancelled) setChartError(err.message || String(err));
      }
    };

    // Initialize local candlestick chart only if the token is still on the bonding curve
    if (!token.completed && chartContainerRef.current) {
      try {
        chart = createChart(chartContainerRef.current, {
          layout: { background: { type: 'solid', color: '#111216' }, textColor: '#d1d4dc' },
          grid: { vertLines: { color: '#2b2b43' }, horzLines: { color: '#2b2b43' } },
          width: chartContainerRef.current.clientWidth || 600,
          height: 500,
          timeScale: { timeVisible: true, secondsVisible: false },
          rightPriceScale: { borderColor: '#2b2b43' },
        });

        // Use v5 Unified Series API: addSeries(CandlestickSeries, options)
        series = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
          wickUpColor: '#26a69a', wickDownColor: '#ef5350',
          priceFormat: {
            type: 'price',
            precision: precision,
            minMove: minMove
          }
        });

        // Set scale margins for main price scale to leave room at the bottom
        series.priceScale().applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.25, // leave bottom 25% empty for volume
          },
        });

        // Add volume series overlay at the bottom with its own hidden scale
        volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          lastValueVisible: false, // hide label on the axis
          priceLineVisible: false  // hide the horizontal line
        });

        chart.priceScale('volume').applyOptions({
          visible: false, // hide the volume axis labels to avoid scale clashing
          scaleMargins: {
            top: 0.8, // volume takes bottom 20%
            bottom: 0,
          },
        });

        ro = new ResizeObserver(() => {
          if (chart && chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        });
        ro.observe(chartContainerRef.current);
      } catch (e) {
        console.error("Chart init error", e);
        setChartError("Chart init error: " + e.message);
      }
    }

    loadData();
    pollInterval = setInterval(loadData, 5000); // refresh every 5s

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      if (ro) ro.disconnect();
      if (chart) chart.remove();
      series = null;
      volumeSeries = null;
    };
  }, [address, loading, token?.completed, timeframe]);

  const fetchTokenDetails = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://rpc.mainnet.chain.robinhood.com");
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
      let website = "";
      let twitter = "";
      let telegram = "";
      try {
        const ipfsUrl = info.tokenURI.replace("ipfs://", `https://${client.clientId}.ipfscdn.io/ipfs/`);
        const metaRes = await fetch(ipfsUrl);
        const metaJson = await metaRes.json();
        tDesc = metaJson.description || "";
        tImg = metaJson.image ? metaJson.image.replace("ipfs://", `https://${client.clientId}.ipfscdn.io/ipfs/`) : "";
        website = metaJson.website || "";
        twitter = metaJson.twitter || "";
        telegram = metaJson.telegram || "";
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
        virtualMemeReserve: vMeme,
        virtualCollateralReserve: vCol,
        completed: info.completed,
        priceChange: 0.0,
        marketCap: mcapUSD, 
        category: collateralAsset.category || "Equities",
        creator: info.creator.substring(0, 6) + "..." + info.creator.substring(38),
        description: tDesc,
        image: tImg,
        website,
        twitter,
        telegram
      });

      // Fetch user balances if connected
      if (account) {
        try {
          const rwaContract = new ethers.Contract(info.collateralToken, ["function balanceOf(address) view returns (uint256)"], provider);
          const mContract = new ethers.Contract(address, ["function balanceOf(address) view returns (uint256)"], provider);
          
          const rwaBal = await rwaContract.balanceOf(account.address);
          const mBal = await mContract.balanceOf(account.address);
          
          setExactCollateralBalance(ethers.formatUnits(rwaBal, 18));
          setExactMemeBalance(ethers.formatUnits(mBal, 18));

          const formatDisplay = (valStr) => {
            const val = parseFloat(valStr);
            if (val === 0) return "0.0";
            return val < 0.001 ? val.toFixed(6) : val.toFixed(4);
          };

          setCollateralBalance(formatDisplay(ethers.formatUnits(rwaBal, 18)));
          setMemeBalance(formatDisplay(ethers.formatUnits(mBal, 18)));
        } catch (balErr) {
          console.warn("Failed to fetch user balances", balErr);
          setCollateralBalance("0.0");
          setMemeBalance("0.0");
          setExactCollateralBalance("0.0");
          setExactMemeBalance("0.0");
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
    const interval = setInterval(fetchTokenDetails, 10000); // refresh token details every 10s
    return () => clearInterval(interval);
  }, [address, account]);

  // Calculate estimated output using xy=k bonding curve
  const calcEstimate = (amount, mode, tok) => {
    if (!tok || !amount || parseFloat(amount) <= 0) return '';
    const dx = parseFloat(amount);
    const vMeme = tok.virtualMemeReserve || 0;
    const vCol = tok.virtualCollateralReserve || 0;
    if (vMeme <= 0 || vCol <= 0) return '';
    let out;
    if (mode === 'buy') {
      // dx = collateral in, dy = meme out
      const k = vMeme * vCol;
      const newCol = vCol + dx;
      const newMeme = k / newCol;
      out = vMeme - newMeme;
    } else {
      // dx = meme in, dy = collateral out
      const k = vMeme * vCol;
      const newMeme = vMeme + dx;
      const newCol = k / newMeme;
      out = vCol - newCol;
    }
    if (out <= 0) return '0';
    return out < 0.000001 ? out.toExponential(4) : out < 0.01 ? out.toFixed(8) : out.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

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
            {token.website && (
              <a href={token.website} target="_blank" rel="noopener noreferrer" className="badge social website" style={{ textDecoration: 'none' }}>
                🌐 Website
              </a>
            )}
            {token.twitter && (
              <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="badge social twitter" style={{ textDecoration: 'none' }}>
                🐦 Twitter/X
              </a>
            )}
            {token.telegram && (
              <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="badge social telegram" style={{ textDecoration: 'none' }}>
                ✈️ Telegram
              </a>
            )}
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
          {token.completed ? (
            /* DexScreener Chart Embed (Uniswap) */
            <div style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', marginBottom: '20px', background: '#111' }}>
              <iframe
                src={`https://dexscreener.com/robinhoodchain/${address}?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartDefaultOnMobileZoom=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Price Chart"
                allow="clipboard-write"
              />
            </div>
          ) : (
            /* Local Candlestick Chart (Bonding Curve) */
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div className="timeframe-selector" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {['1m', '5m', '15m', '1h', '24h'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      background: timeframe === tf ? '#26a69a' : '#222',
                      color: timeframe === tf ? '#fff' : '#888',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
              {chartError && (
                <div style={{ color: '#ef5350', background: 'rgba(239, 83, 80, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid #ef5350', marginBottom: '15px', fontSize: '13px', lineHeight: '1.5' }}>
                  ⚠️ <strong>Error loading chart:</strong> {chartError}
                </div>
              )}
              <div 
                ref={chartContainerRef} 
                className="chart-container-native" 
                style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', background: '#111216' }}
              ></div>
            </div>
          )}

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
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#e0e0e0' }}>{t.trader.substring(0,6)}...</td>
                      <td style={{ padding: '10px', color: '#e0e0e0' }}>{t.memeAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                      <td style={{ padding: '10px', color: '#e0e0e0' }}>{t.colAmount.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
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
                {/* DEX-Style Swap Panel */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => { setTradeMode('buy'); setPayAmount(''); setEstimatedOutput(''); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                      background: tradeMode === 'buy' ? '#26a69a' : '#1a1a1a',
                      color: tradeMode === 'buy' ? '#000' : '#888',
                      transition: 'all 0.2s'
                    }}
                  >Buy</button>
                  <button
                    onClick={() => { setTradeMode('sell'); setPayAmount(''); setEstimatedOutput(''); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                      background: tradeMode === 'sell' ? '#ef5350' : '#1a1a1a',
                      color: tradeMode === 'sell' ? '#fff' : '#888',
                      transition: 'all 0.2s'
                    }}
                  >Sell</button>
                </div>

                {/* YOU PAY */}
                <div style={{ background: '#111216', borderRadius: '12px', padding: '16px', marginBottom: '6px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>You Pay</span>
                    <span
                      style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}
                      onClick={() => {
                        const bal = tradeMode === 'buy' ? exactCollateralBalance : exactMemeBalance;
                        setPayAmount(bal);
                        setEstimatedOutput(calcEstimate(bal, tradeMode, token));
                      }}
                    >
                      Balance: {tradeMode === 'buy' ? collateralBalance : memeBalance}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={payAmount}
                      onChange={(e) => {
                        setPayAmount(e.target.value);
                        setEstimatedOutput(calcEstimate(e.target.value, tradeMode, token));
                      }}
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        fontSize: '28px', fontWeight: '700', color: '#fff',
                        fontFamily: 'var(--font-geist-mono)'
                      }}
                    />
                    <div style={{
                      background: '#1e1e1e', border: '1px solid #333', borderRadius: '20px',
                      padding: '6px 14px', fontWeight: '700', fontSize: '14px',
                      color: tradeMode === 'buy' ? '#4dd0c4' : '#ef5350',
                      whiteSpace: 'nowrap'
                    }}>
                      {tradeMode === 'buy' ? token.collateralSymbol : token.symbol}
                    </div>
                  </div>
                </div>

                {/* SWAP ARROW */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#1a1a1a', border: '2px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', cursor: 'default'
                  }}>↓</div>
                </div>

                {/* YOU RECEIVE */}
                <div style={{ background: '#111216', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>You Receive</span>
                    <span style={{ color: '#666', fontSize: '13px' }}>
                      Balance: {tradeMode === 'buy' ? memeBalance : collateralBalance}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      flex: 1, fontSize: '28px', fontWeight: '700',
                      color: estimatedOutput ? '#fff' : '#444',
                      fontFamily: 'var(--font-geist-mono)'
                    }}>
                      {estimatedOutput || '0.0'}
                    </div>
                    <div style={{
                      background: '#1e1e1e', border: '1px solid #333', borderRadius: '20px',
                      padding: '6px 14px', fontWeight: '700', fontSize: '14px',
                      color: tradeMode === 'buy' ? '#ef5350' : '#4dd0c4',
                      whiteSpace: 'nowrap'
                    }}>
                      {tradeMode === 'buy' ? token.symbol : token.collateralSymbol}
                    </div>
                  </div>
                </div>

                {/* PRICE INFO */}
                {payAmount && estimatedOutput && (
                  <div style={{ background: '#0d0d0d', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', fontSize: '13px', color: '#666' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Rate</span>
                      <span style={{ color: '#aaa' }}>
                        1 {tradeMode === 'buy' ? token.collateralSymbol : token.symbol} = {(parseFloat(estimatedOutput || 0) / parseFloat(payAmount || 1)).toLocaleString(undefined, { maximumFractionDigits: 4 })} {tradeMode === 'buy' ? token.symbol : token.collateralSymbol}
                      </span>
                    </div>
                  </div>
                )}

                {/* TRADE BUTTON */}
                <button
                  onClick={handleTrade}
                  disabled={isSubmitting}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: '700', fontSize: '16px', letterSpacing: '0.03em',
                    background: isSubmitting ? '#333' : tradeMode === 'buy'
                      ? 'linear-gradient(135deg, #26a69a, #00bfa5)'
                      : 'linear-gradient(135deg, #ef5350, #e53935)',
                    color: '#fff',
                    transition: 'all 0.2s',
                    boxShadow: isSubmitting ? 'none' : tradeMode === 'buy'
                      ? '0 4px 20px rgba(38,166,154,0.3)'
                      : '0 4px 20px rgba(239,83,80,0.3)'
                  }}
                >
                  {isSubmitting
                    ? (tradeStatus || 'Processing...')
                    : tradeMode === 'buy'
                      ? `Buy ${token.symbol}`
                      : `Sell ${token.symbol}`
                  }
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
              <span>{token.currentCollateral > 0 && token.currentCollateral < 0.01 ? token.currentCollateral.toFixed(6) : token.currentCollateral.toFixed(2)} / {token.targetCollateral.toFixed(2)} {token.collateralSymbol}</span>
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
