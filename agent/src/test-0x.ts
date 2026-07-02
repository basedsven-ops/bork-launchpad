
const API_KEY = "61c39645-5779-4e38-9adc-f2f6d5ed945c";
const CHAIN_ID = "4663";
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const TAKER = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";

async function test0x() {
  const sellAmount = "1000000000000000"; // 0.001 ETH
  
  // 0x Swap API v2 price endpoint
  const url = `https://api.0x.org/swap/v2/price?chainId=${CHAIN_ID}&sellToken=ETH&buyToken=${TSLA}&sellAmount=${sellAmount}&taker=${TAKER}`;
  
  console.log("Fetching quote from:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "0x-api-key": API_KEY,
        "Accept": "application/json"
      }
    });
    
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test0x();
