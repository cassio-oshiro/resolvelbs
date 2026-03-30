export interface Torre {
  cellId: number;
  lac: number;
  mcc: number;
  mnc: number;
  signal: number;
  origemIdx: number;
  dadoBruto: string;
  lat?: number;
  lng?: number;
  loading?: boolean;
}

export const extrairTorresDoHex = (input: string): Torre[] => {
  const listaHex = input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const todasAsTorres: Torre[] = [];

  listaHex.forEach((hex, index) => {
    const cleanHex = hex.replace(/^0x/i, "");
    const bytes = Buffer.from(cleanHex, "hex");

    for (let i = 0; i <= bytes.length - 14; i += 14) {
      const chunk = bytes.slice(i, i + 14);

      todasAsTorres.push({
        cellId: chunk.readInt32LE(0),
        lac: chunk.readInt32LE(4),
        mcc: chunk.readUInt16LE(8),
        mnc: chunk.readUInt16LE(10),
        signal: chunk.readUInt16LE(12),
        origemIdx: index + 1,
        dadoBruto: hex,
      });
    }
  });

  return todasAsTorres;
};
