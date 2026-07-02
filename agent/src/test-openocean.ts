const CHAIN_ID = "4663";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const TAKER = "0xfdd498B917D2BB50e080B760EffC2e75668B6BC2";

async function queryOpenOcean() {
  const amount = "0.01"; // 0.01 ETH
  const gasPrice = "0.05"; // 0.05 gwei
  const url = `https://open-api.openocean.finance/v3/${CHAIN_ID}/quote?inTokenAddress=ETH&outTokenAddress=${TSLA}&amount=${amount}&gasPrice=${gasPrice}`;
  
  console.log("Querying OpenOcean:", url);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

queryOpenOcean();
