/**
 * Universal helper to extract data payload from backend ApiResponse wrappers.
 * Handles both { success: true, data: { ... } }, { data: [...] }, and unwrapped objects.
 */
export const extractData = <T = any>(response: any): T => {
  if (!response) return null as unknown as T;
  const res = response.data !== undefined ? response.data : response;
  if (res?.success !== undefined && res.data !== undefined) {
    return res.data;
  }
  return res as T;
};

export default extractData;
