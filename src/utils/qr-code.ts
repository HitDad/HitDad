import QRCode from 'qrcode';

const VIET_BANK_BY_BIN: Record<string, string> = {
  '970422': 'MB Bank',
  '970436': 'Vietcombank',
  '970407': 'Techcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970416': 'ACB',
  '970423': 'TPBank',
  '970432': 'VPBank',
  '970403': 'Sacombank',
  '970405': 'Agribank',
  '970441': 'VIB',
  '970448': 'OCB',
  '970437': 'HDBank',
  '970426': 'MSB',
  '970443': 'SHB',
  '970431': 'Eximbank',
  '970428': 'Nam A Bank',
  '970449': 'LPBank',
  '970454': 'BVBank / Timo',
  '970412': 'PVcomBank',
  '970440': 'SeABank',
  '970424': 'Shinhan Bank',
  '970429': 'SCB',
  '970406': 'DongA Bank',
  '970414': 'OceanBank',
  '970438': 'BaoVietBank',
  '970427': 'VietABank',
  '970433': 'VietBank',
  '970452': 'KienLongBank',
  '970409': 'BacABank',
  '970419': 'NCB',
  '970425': 'ABBANK',
  '970434': 'Indovina Bank',
  '970439': 'Public Bank',
  '970410': 'Standard Chartered',
  '970421': 'VRB',
  '546034': 'CAKE by VPBank',
  '546035': 'Ubank by VPBank',
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_DEFLATE_BLOCK_SIZE = 65535;
const MOD_ADLER = 65521;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    a += bytes[i];
    b += a;
    if ((i & 0x3ff) === 0x3ff) {
      a %= MOD_ADLER;
      b %= MOD_ADLER;
    }
  }
  a %= MOD_ADLER;
  b %= MOD_ADLER;
  return ((b << 16) | a) >>> 0;
}

function writeUint32BE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeUint32BE(chunk, 0, data.length);
  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);
  chunk.set(data, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  writeUint32BE(chunk, 8 + data.length, crc);
  return chunk;
}

function encodeStoredZlib(raw: Uint8Array): Uint8Array {
  const blockCount = Math.max(1, Math.ceil(raw.length / MAX_DEFLATE_BLOCK_SIZE));
  const compressed = new Uint8Array(2 + blockCount * 5 + raw.length + 4);
  let outOffset = 0;

  // Zlib header: CMF=0x78 (DEFLATE, 32K window), FLG=0x01 (FCHECK valid)
  compressed[outOffset++] = 0x78;
  compressed[outOffset++] = 0x01;

  for (let blockIdx = 0; blockIdx < blockCount; blockIdx += 1) {
    const start = blockIdx * MAX_DEFLATE_BLOCK_SIZE;
    const end = Math.min(raw.length, start + MAX_DEFLATE_BLOCK_SIZE);
    const len = end - start;
    const nlen = ~len & 0xffff;
    const isFinal = blockIdx === blockCount - 1;

    compressed[outOffset++] = isFinal ? 0x01 : 0x00;
    compressed[outOffset++] = len & 0xff;
    compressed[outOffset++] = (len >>> 8) & 0xff;
    compressed[outOffset++] = nlen & 0xff;
    compressed[outOffset++] = (nlen >>> 8) & 0xff;
    compressed.set(raw.subarray(start, end), outOffset);
    outOffset += len;
  }

  writeUint32BE(compressed, outOffset, adler32(raw));
  return compressed;
}

function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const hasB1 = i + 1 < bytes.length;
    const hasB2 = i + 2 < bytes.length;
    const b1 = hasB1 ? bytes[i + 1] : 0;
    const b2 = hasB2 ? bytes[i + 2] : 0;

    const triple = (b0 << 16) | (b1 << 8) | b2;
    parts.push(
      BASE64_ALPHABET[(triple >>> 18) & 0x3f],
      BASE64_ALPHABET[(triple >>> 12) & 0x3f],
      hasB1 ? BASE64_ALPHABET[(triple >>> 6) & 0x3f] : '=',
      hasB2 ? BASE64_ALPHABET[triple & 0x3f] : '=',
    );
  }
  return parts.join('');
}

/** Resolves a readable Vietnamese bank name from a NAPAS BIN code when recognized. */
export function getVietBankName(bin: string | null | undefined): string | null {
  if (!bin) return null;
  const trimmed = bin.trim();
  if (!trimmed) return null;
  return VIET_BANK_BY_BIN[trimmed] ?? `Ngân hàng (${trimmed})`;
}

/** Groups long bank account numbers into readable chunks for display while keeping raw text for copy. */
export function formatBankAccountNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\s+/g, '');
  if (!/^\d{6,}$/.test(cleaned)) return raw.trim();
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Converts a raw EMVCo VietQR payload (from PayOS) into a crisp grayscale PNG data URI,
 * or passes through existing `data:image/` and `http(s)://` image URLs unchanged.
 */
export function toQrImageUri(
  qrValue: string | null | undefined,
  scale = 6,
  marginModules = 3,
): string | null {
  if (!qrValue) return null;
  const trimmed = qrValue.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  try {
    const qr = QRCode.create(trimmed, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const totalModules = moduleCount + marginModules * 2;
    const pixelSize = totalModules * scale;
    const rowStride = 1 + pixelSize;
    const rawScanlines = new Uint8Array(pixelSize * rowStride);

    rawScanlines.fill(0xff);
    for (let y = 0; y < pixelSize; y += 1) {
      rawScanlines[y * rowStride] = 0x00; // Filter byte 0 (None)
    }

    for (let mr = 0; mr < moduleCount; mr += 1) {
      for (let mc = 0; mc < moduleCount; mc += 1) {
        if (!qr.modules.get(mr, mc)) continue;
        const startY = (mr + marginModules) * scale;
        const startX = (mc + marginModules) * scale;
        for (let dy = 0; dy < scale; dy += 1) {
          const rowBase = (startY + dy) * rowStride + 1 + startX;
          rawScanlines.fill(0x00, rowBase, rowBase + scale);
        }
      }
    }

    const ihdrData = new Uint8Array(13);
    writeUint32BE(ihdrData, 0, pixelSize);
    writeUint32BE(ihdrData, 4, pixelSize);
    ihdrData[8] = 8; // 8-bit grayscale
    ihdrData[9] = 0; // ColorType 0 (grayscale)
    ihdrData[10] = 0; // Compression 0
    ihdrData[11] = 0; // Filter 0
    ihdrData[12] = 0; // Interlace 0

    const ihdrChunk = makePngChunk('IHDR', ihdrData);
    const idatChunk = makePngChunk('IDAT', encodeStoredZlib(rawScanlines));
    const iendChunk = makePngChunk('IEND', new Uint8Array(0));

    const png = new Uint8Array(
      PNG_SIGNATURE.length + ihdrChunk.length + idatChunk.length + iendChunk.length,
    );
    let offset = 0;
    png.set(PNG_SIGNATURE, offset);
    offset += PNG_SIGNATURE.length;
    png.set(ihdrChunk, offset);
    offset += ihdrChunk.length;
    png.set(idatChunk, offset);
    offset += idatChunk.length;
    png.set(iendChunk, offset);

    return `data:image/png;base64,${bytesToBase64(png)}`;
  } catch {
    return null;
  }
}
