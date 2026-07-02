const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const TAKER = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";

async function queryLlama(chain: string) {
  const amount = "10000000000000000"; // 0.01 ETH in wei
  // DefiLlama Swap API
  const url = `https://swap.defillama.com/quote?from=0x0000000000000000000000000000000000000000&to=${TSLA}&amount=${amount}&chain=${chain}&slippage=0.5&taker=${TAKER}`;
  
  console.log(`Querying LlamaSwap for chain "${chain}":`, url);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

async function main() {
  await queryLlama("robinhood");
  await queryLlama("robinhood_chain");
  await queryLlama("robinhood-chain");
}

main();
