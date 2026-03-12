import { authClient } from "./auth-client";

export interface DriveFileMetadata { id: string; name: string; }

export const GoogleDriveSync = {
  async _getAuth(): Promise<string> {
    const res = await authClient.getAccessToken({ providerId: "google" });
    const token = res.data?.accessToken;
    if (!token) throw new Error("Auth Failed");
    return token;
  },

  async findFileByName(name: string): Promise<DriveFileMetadata | null> {
    try {
      const token = await this._getAuth();
      const params = new URLSearchParams({
        q: `name = '${name}' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive' // or 'appDataFolder' if you stored it there
      });
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.files && data.files.length > 0 ? data.files[0] : null;
    } catch (error) {
      return null;
    }
  },

  async downloadFile(driveId: string): Promise<any> {
    const token = await this._getAuth();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  },

  async syncFile(fileName: string, data: any, existingId?: string): Promise<DriveFileMetadata> {
    const token = await this._getAuth();
    const url = existingId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    const method = existingId ? "PATCH" : "POST";
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    let body: string;
    if (existingId) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    } else {
      const boundary = "sync_boundary_nick";
      headers["Content-Type"] = `multipart/related; boundary=${boundary}`;
      const metadata = { name: fileName, mimeType: "application/json" };
      body = [
        `--${boundary}`,
        `Content-Type: application/json; charset=UTF-8`,
        ``,
        JSON.stringify(metadata),
        `--${boundary}`,
        `Content-Type: application/json`,
        ``,
        JSON.stringify(data),
        `--${boundary}--`
      ].join("\r\n");
    }

    const res = await fetch(url, { method, headers, body });
    if (!res.ok) throw new Error("Drive Upload Failed");
    return await res.json();
  },

  async deleteFile(driveId: string): Promise<void> {
    const token = await this._getAuth();
    await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
  },
};