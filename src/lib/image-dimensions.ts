/** Lee ancho y alto de JPEG o PNG desde el buffer, sin dependencias externas. */
export function readImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } | null {
  if (mimeType === "image/png" && buffer.length >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) return { width, height };
        break;
      }
      offset += 2 + length;
    }
  }

  if (mimeType === "image/webp" && buffer.length >= 30) {
    const riff = buffer.toString("ascii", 0, 4);
    const webp = buffer.toString("ascii", 8, 12);
    if (riff === "RIFF" && webp === "WEBP") {
      const chunk = buffer.toString("ascii", 12, 16);
      if (chunk === "VP8 ") {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
      }
      if (chunk === "VP8L" && buffer.length >= 25) {
        const bits = buffer.readUInt32LE(21);
        const width = (bits & 0x3fff) + 1;
        const height = ((bits >> 14) & 0x3fff) + 1;
        if (width > 0 && height > 0) return { width, height };
      }
    }
  }

  return null;
}
