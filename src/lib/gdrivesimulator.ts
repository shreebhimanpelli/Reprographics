export function mockDriveUpload(fileName: string, trackingNumber: string) {
  const fileId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    fileId,
    webViewLink: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    fileName,
    trackingNumber,
  };
}
