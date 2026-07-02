const API_KEY = "61c39645-5779-4e38-9adc-f2f6d5ed945c";
const CHAIN_ID = "4663";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const TAKER = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";

async function query0x(sellToken: string, amount: string) {
  const url = `https://api.0x.org/swap/v2/price?chainId=${CHAIN_ID}&sellToken=${sellToken}&buyToken=${TSLA}&sellAmount=${amount}&taker=${TAKER}`;
  console.log(`Querying: ${sellToken} for amount ${amount}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "0x-api-key": API_KEY,
        "Accept": "application/json"
      }
    });
    console.log("Status:", res.status);
    const json = await res.json();
    if (res.status !== 200) {
      console.log("Error response:", JSON.stringify(json));
    } else {
      console.log("Success! Estimated Price:", json.summary?.price || json.price);
    }
  } catch (err: any) {
    console.error("Fetch failed:", err.message);
  }
}

async function main() {
  // Test native ETH with different amounts
  // 1. 0.01 ETH
  await query0x("ETH", "10000000000000000"); 
  // 2. 0.1 ETH
  await query0x("ETH", "100000000000000000"); 
  // 3. 1 ETH
  await query0x("ETH", "1000000000000000000"); 

  // Test WETH
  const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
  await query0x(WETH, "1000000000000000000");
}

main();
