import { dypai } from "./dypai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = dypai.api as any;

/**
 * Upload a product image via the SDK's built-in Smart Upload.
 */
export async function uploadProductImage(
  file: File,
  filePath: string
): Promise<{ filePath: string | null; error: string | null }> {
  try {
    const { data, error } = await api.upload("storage_product_images", file, {
      params: { operation: "upload", file_path: filePath },
    });
    if (error) return { filePath: null, error: error.message };
    return { filePath: data?.file_path || filePath, error: null };
  } catch (err) {
    return { filePath: null, error: (err as Error).message };
  }
}

/**
 * Get a signed URL for a file in the images bucket.
 */
export async function getProductImageUrl(
  filePath: string
): Promise<string | null> {
  try {
    const { data, error } = await dypai.api.post("storage_product_images", {
      operation: "download",
      file_path: filePath,
    });
    if (error || !data) return null;
    return data.signed_url || data.url || null;
  } catch {
    return null;
  }
}
