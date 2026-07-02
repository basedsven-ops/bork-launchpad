const API_KEY = "61c39645-5779-4e38-9adc-f2f6d5ed945c";
const CHAIN_ID = "4663";
const TAKER = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

async function query0x(buyToken: string, amount: string) {
  const url = `https://api.0x.org/swap/v2/price?chainId=${CHAIN_ID}&sellToken=ETH&buyToken=${buyToken}&sellAmount=${amount}&taker=${TAKER}`;
  console.log(`Querying ETH to ${buyToken} for amount ${amount}...`);
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
    console.error("Fetch failed:", err.message);
  }
}

async function main() {
  await query0x(USDG, "100000000000000000"); // 0.1 ETH
}

main();
