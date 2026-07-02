import { ethers } from "ethers";

const pk = "0x5dc5df158f328cd17b6a2aeaae16795917f473c901401fc90ec52d2537d88f2b";
const wallet = new ethers.Wallet(pk);
console.log(`Address: ${wallet.address}`);
