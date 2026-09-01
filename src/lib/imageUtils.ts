/**
 * Utility helper for student photo URLs and Google Drive direct link conversion.
 * Converts Google Drive share/view links into direct lightweight CDN links served directly from Google,
 * preventing any server hosting bandwidth consumption.
 */

export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null

  // Pattern 1: /file/d/FILE_ID/
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1]

  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1]

  // Pattern 3: lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/)
  if (lh3Match && lh3Match[1]) return lh3Match[1]

  return null
}

/**
 * Returns a direct lightweight image URL for browser rendering.
 * @param url Raw image URL or Google Drive link
 * @param size Optional pixel constraint (e.g. 400 for thumbnails to keep memory/bandwidth minimal)
 */
export function getDirectImageUrl(url?: string | null, size?: number): string {
  if (!url || typeof url !== 'string' || !url.trim()) return ''

  const cleanUrl = url.trim()
  const driveId = getGoogleDriveFileId(cleanUrl)

  if (driveId) {
    // Google CDN direct link
    return `https://lh3.googleusercontent.com/d/${driveId}${size ? `=s${size}` : ''}`
  }

  return cleanUrl
}
