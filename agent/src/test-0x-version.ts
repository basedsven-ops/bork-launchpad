const API_KEY = "61c39645-5779-4e38-9adc-f2f6d5ed945c";
const CHAIN_ID = "4663";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const TAKER = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";

async function query0x(endpoint: string) {
  const sellAmount = "1000000000000000000"; // 1 ETH
  const url = `https://api.0x.org/swap/v2/${endpoint}?chainId=${CHAIN_ID}&sellToken=ETH&buyToken=${TSLA}&sellAmount=${sellAmount}&taker=${TAKER}`;
  
  console.log(`Querying ${endpoint} with v2 headers...`);
  try {
    const res = await fetch(url, {
      headers: {
        "0x-api-key": API_KEY,
        "0x-version": "v2",
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

async function main() {
  await query0x("price");
  await query0x("quote");
}

main();
