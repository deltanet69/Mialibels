/**
 * RFID / NFC UID Converter & Multi-Format Variant Generator
 * Mendukung konversi otomatis antara format:
 * - Raw HEX (misal 04A23B5C / 04:A2:3B:5C)
 * - Big-Endian Decimal & 10-digit padded (misal 77740892 / 0077740892)
 * - Little-Endian / Reverse-Byte Decimal (misal 1547379204 - format standar USB desktop reader)
 * - Wiegand 26 / 34 format
 */

export function generateRfidVariants(inputRfid: string): string[] {
  if (!inputRfid) return []

  const clean = inputRfid.trim().replace(/[:\s-]/g, '').toUpperCase()
  const variants = new Set<string>()

  // 1. Input asli dan format bersih
  variants.add(inputRfid.trim())
  variants.add(clean)
  variants.add(clean.toLowerCase())

  // Cek apakah input adalah HEX (4 - 14 karakter hex)
  const isHex = /^[0-9A-F]+$/i.test(clean) && clean.length >= 4 && clean.length <= 16

  if (isHex && clean.length % 2 === 0) {
    // A. Big-Endian Decimal
    try {
      const bigDec = BigInt('0x' + clean).toString()
      variants.add(bigDec)
      variants.add(bigDec.padStart(10, '0'))
      variants.add(bigDec.padStart(8, '0'))
    } catch (e) {}

    // B. Little-Endian (Reversed Bytes)
    try {
      const bytes: string[] = []
      for (let i = 0; i < clean.length; i += 2) {
        bytes.push(clean.substring(i, i + 2))
      }
      const revHex = [...bytes].reverse().join('')
      variants.add(revHex)
      variants.add(revHex.toLowerCase())

      const revDec = BigInt('0x' + revHex).toString()
      variants.add(revDec)
      variants.add(revDec.padStart(10, '0'))
      variants.add(revDec.padStart(8, '0'))
    } catch (e) {}

    // C. Wiegand 26 (3 bytes terakhir)
    if (clean.length >= 6) {
      try {
        const last3BytesHex = clean.slice(-6)
        const wgDec = parseInt(last3BytesHex, 16).toString()
        variants.add(wgDec)
        variants.add(wgDec.padStart(10, '0'))
      } catch (e) {}
    }
  }

  // Cek apakah input adalah Decimal (angka saja)
  const isDecimal = /^\d+$/.test(clean)
  if (isDecimal) {
    try {
      const num = BigInt(clean)
      const hex = num.toString(16).toUpperCase()
      variants.add(hex)
      variants.add(hex.padStart(8, '0'))

      // Reverse bytes dari hex
      const paddedHex = hex.length % 2 !== 0 ? '0' + hex : hex
      const bytes: string[] = []
      for (let i = 0; i < paddedHex.length; i += 2) {
        bytes.push(paddedHex.substring(i, i + 2))
      }
      const revHex = [...bytes].reverse().join('')
      variants.add(revHex)

      const revDec = BigInt('0x' + revHex).toString()
      variants.add(revDec)
      variants.add(revDec.padStart(10, '0'))
    } catch (e) {}

    // Hapus leading zero jika ada
    const unpadded = clean.replace(/^0+/, '')
    if (unpadded) variants.add(unpadded)
  }

  return Array.from(variants).filter(Boolean)
}
