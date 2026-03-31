// export interface Torre {
//   cellId: number;
//   lac: number;
//   mcc: number;
//   mnc: number;
//   signal: number;
//   timeStamp: Date | null;
//   latitude: number;
//   longitude: number;
//   origemIdx: number;
//   dadoBruto: string;
//   lat?: number;
//   lng?: number;
//   loading?: boolean;
// }

// const CHUNK_SIZE = 26;
// const MIN_YEAR = 2010;
// const MAX_YEAR = 2035;

// function parseTimestamp(raw: number): Date | null {
//   if (raw === 0) return null;
//   const date = new Date(raw * 1000);
//   const year = date.getFullYear();
//   if (year < MIN_YEAR || year > MAX_YEAR) return null;
//   return date;
// }

// function parseFloat32(value: number): number {
//   // Retorna 0 se o float for claramente inválido (NaN, Infinity, ou fora de range geo)
//   if (!isFinite(value)) return 0;
//   if (Math.abs(value) > 180) return 0;
//   return value;
// }

// export const extrairTorresDoHex = (input: string): Torre[] => {
//   const listaHex = input
//     .split(";")
//     .map((s) => s.trim())
//     .filter((s) => s.length > 0);

//   const todasAsTorres: Torre[] = [];

//   listaHex.forEach((hex, index) => {
//     const cleanHex = hex.replace(/^0x/i, "");

//     if (cleanHex.length % 2 !== 0) {
//       console.warn(`Hex inválido no índice ${index}: comprimento ímpar`);
//       return;
//     }

//     const bytes = Buffer.from(cleanHex, "hex");

//     if (bytes.length < CHUNK_SIZE) {
//       console.warn(`Hex muito curto no índice ${index}: ${bytes.length} bytes`);
//       return;
//     }

//     for (let i = 0; i <= bytes.length - CHUNK_SIZE; i += CHUNK_SIZE) {
//       const chunk = bytes.slice(i, i + CHUNK_SIZE);

//       const tsRaw = chunk.readUInt32LE(14);
//       const timeStamp = parseTimestamp(tsRaw);

//       const latitude  = parseFloat32(chunk.readFloatLE(18));
//       const longitude = parseFloat32(chunk.readFloatLE(22));

//       todasAsTorres.push({
//         cellId:    chunk.readInt32LE(0),
//         lac:       chunk.readInt32LE(4),
//         mcc:       chunk.readUInt16LE(8),
//         mnc:       chunk.readUInt16LE(10),
//         signal:    chunk.readUInt16LE(12),
//         timeStamp,
//         latitude,
//         longitude,
//         origemIdx: index + 1,
//         dadoBruto: hex,
//       });
//     }
//   });

//   return todasAsTorres;
// };
export interface Torre {
  cellId: number;
  lac: number;
  mcc: number;
  mnc: number;
  signal: number;
  timeStamp: Date | null;
  latitude: number;
  longitude: number;
  origemIdx: number;
  registroIdx: number;
  dadoBruto: string;
  lat?: number;
  lng?: number;
  loading?: boolean;
}

const TORRE_SIZE = 14;
const FOOTER_SIZE = 12;
const MIN_YEAR = 2010;
const MAX_YEAR = 2035;

function lerTorresNoPacote(bytes: Buffer): number {
  for (let n = 1; n <= 10; n++) {
    const footerOffset = n * TORRE_SIZE;
    if (footerOffset + FOOTER_SIZE > bytes.length) break;
    const tsRaw = bytes.readUInt32LE(footerOffset);
    const year = new Date(tsRaw * 1000).getFullYear();
    if (year >= MIN_YEAR && year <= MAX_YEAR) return n;
  }
  return 0;
}

function parseTimestamp(raw: number): Date | null {
  if (raw === 0) return null;
  const date = new Date(raw * 1000);
  const year = date.getFullYear();
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return date;
}

function parseCoord(value: number, max: number): number {
  if (!isFinite(value) || Math.abs(value) > max) return 0;
  return value;
}

export const extrairTorresDoHex = (input: string): Torre[] => {
  const listaHex = input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const todasAsTorres: Torre[] = [];

  listaHex.forEach((hex, pacoteIdx) => {
    const cleanHex = hex.replace(/^0x/i, "");

    if (cleanHex.length % 2 !== 0) {
      console.warn(`Hex inválido no pacote ${pacoteIdx + 1}: comprimento ímpar`);
      return;
    }

    const bytes = Buffer.from(cleanHex, "hex");
    const numTorres = lerTorresNoPacote(bytes);

    if (numTorres === 0) {
      console.warn(`Pacote ${pacoteIdx + 1}: não foi possível identificar o layout`);
      return;
    }

    const footerOffset = numTorres * TORRE_SIZE;
    const tsRaw     = bytes.readUInt32LE(footerOffset);
    const timeStamp = parseTimestamp(tsRaw);
    const latitude  = parseCoord(bytes.readFloatLE(footerOffset + 4), 90);
    const longitude = parseCoord(bytes.readFloatLE(footerOffset + 8), 180);

    for (let t = 0; t < numTorres; t++) {
      const offset = t * TORRE_SIZE;
      todasAsTorres.push({
        cellId:      bytes.readInt32LE(offset),
        lac:         bytes.readInt32LE(offset + 4),
        mcc:         bytes.readUInt16LE(offset + 8),
        mnc:         bytes.readUInt16LE(offset + 10),
        signal:      bytes.readUInt16LE(offset + 12),
        timeStamp,
        latitude,
        longitude,
        origemIdx:   pacoteIdx + 1,
        registroIdx: t + 1,
        dadoBruto:   hex,
      });
    }
  });

  return todasAsTorres;
};
