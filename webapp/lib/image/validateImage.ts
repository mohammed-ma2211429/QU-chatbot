// Mirrors agent_groq.py's UnsupportedAttachmentError / _encode_image_to_data_url
// validation intent, adapted for a browser-submitted data URL instead of a
// filesystem path.

export class UnsupportedAttachmentError extends Error {}

const DATA_URL_RE = /^data:([^;]+);base64,([\s\S]+)$/;

// Magic-byte signatures for common image formats — defense in depth so we
// don't blindly trust a client-supplied mime string (a buggy/malicious
// client could send an arbitrary data URL with a spoofed image/* prefix).
const SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" (WEBP checked via container, good enough here)
];

const MAX_DECODED_BYTES = 8 * 1024 * 1024; // 8MB, independent of client-side downscaling

export interface ValidatedImage {
  mimeType: string;
  base64: string;
  dataUrl: string;
}

/**
 * Validates a client-submitted image data URL. Throws
 * UnsupportedAttachmentError (with a message matching the Python version's
 * in-character rejection wording) if it isn't actually an image, or is too
 * large.
 */
export function validateImageDataUrl(dataUrl: string, name: string): ValidatedImage {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    throw new UnsupportedAttachmentError(
      `'${name}' is not a valid image file (could not parse the attachment).`
    );
  }
  const [, mimeType, base64] = match;

  if (!mimeType.startsWith("image/")) {
    throw new UnsupportedAttachmentError(
      `'${name}' is not an image file (detected type: ${mimeType}).`
    );
  }

  const decoded = Buffer.from(base64, "base64");
  if (decoded.byteLength > MAX_DECODED_BYTES) {
    throw new UnsupportedAttachmentError(
      `'${name}' is too large (${(decoded.byteLength / 1024 / 1024).toFixed(1)}MB). Please attach an image under 8MB.`
    );
  }

  const looksLikeImage = SIGNATURES.some((sig) =>
    sig.bytes.every((b, i) => decoded[i] === b)
  );
  if (!looksLikeImage) {
    throw new UnsupportedAttachmentError(
      `'${name}' is not an image file (detected type: ${mimeType || "unknown"}).`
    );
  }

  return { mimeType, base64, dataUrl };
}
