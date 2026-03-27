import { useState, useEffect } from "react";
import { getProductImageUrl } from "@/lib/storage";

/**
 * Resolves a storage file_path to a signed URL.
 * Returns null while loading, or the signed URL when ready.
 * Caches URLs in sessionStorage to avoid repeated calls.
 */
export function useStorageUrl(filePath: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) { setUrl(null); return; }
    if (filePath.startsWith("http")) { setUrl(filePath); return; }

    const cacheKey = `img:${filePath}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { url: cachedUrl, exp } = JSON.parse(cached);
      if (Date.now() < exp) { setUrl(cachedUrl); return; }
    }

    let cancelled = false;
    getProductImageUrl(filePath).then((signedUrl) => {
      if (cancelled || !signedUrl) return;
      setUrl(signedUrl);
      sessionStorage.setItem(cacheKey, JSON.stringify({ url: signedUrl, exp: Date.now() + 13 * 60 * 1000 }));
    });

    return () => { cancelled = true; };
  }, [filePath]);

  return url;
}
