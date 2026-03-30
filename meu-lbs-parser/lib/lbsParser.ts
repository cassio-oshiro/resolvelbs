const processarLBS = (hexString) => {
  const cleanHex = hexString.replace(/^0x/i, '').replace(/\s/g, '');
  const bytes = Buffer.from(cleanHex, 'hex');
  const torres = [];

  for (let i = 0; i <= bytes.length - 14; i += 14) {
    const chunk = bytes.slice(i, i + 14);

    torres.push({
      cellId: chunk.readInt32BE(0),
      lac: chunk.readInt32BE(4),
      mcc: chunk.readUInt16BE(8),
      mnc: chunk.readUInt16BE(10),
      signal: chunk.readUInt16BE(12)
    });
  }
  return torres;
};
