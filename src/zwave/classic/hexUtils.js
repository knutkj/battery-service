export function hexToUint8Array(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have even length.");
  }
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    array[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return array;
}
