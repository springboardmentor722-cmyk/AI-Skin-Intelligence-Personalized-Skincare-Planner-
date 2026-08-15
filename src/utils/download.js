import api from "../api/axios";

/**
 * Downloads a protected file (PDF/Excel) through the authenticated axios
 * instance and saves it via a temporary link. Needed because report
 * endpoints require the Authorization header — a plain <a href> can't
 * carry that, so we fetch as a blob and trigger the save manually.
 */
export async function downloadFile(url, filename) {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
