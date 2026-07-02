import { ethers } from "ethers";

const valStr = "-340282366920938463463374607431768211455999999998337954";
const val = BigInt(valStr);

// Convert to 256-bit unsigned hex representation (two's complement)
const hex = "0x" + (val & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn).toString(16);
console.log(`Hex representation: ${hex}`);

// Extract upper 128 bits (amount0) and lower 128 bits (amount1)
const upper = hex.substring(0, 34);
const lower = "0x" + hex.substring(34);

console.log(`Upper 128 bits hex: ${upper}`);
console.log(`Lower 128 bits hex: ${lower}`);

// Parse as signed 128-bit integers
function toSigned128(hexStr: string): bigint {
  let val = BigInt(hexStr);
  if (val & (1n << 127n)) {
    val = val - (1n << 128n);
  }
  return val;
}

console.log(`amount0: ${toSigned128(upper)}`);
console.log(`amount1: ${toSigned128(lower)}`);
