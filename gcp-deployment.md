# 🚀 Google Cloud Platform (GCP) Live Deployment Details

The **FLAME Reprographics Portal** has been deployed to Google Cloud Platform under a dedicated project.

---

## 📍 Live GCP Deployment Status

- **GCP Project Name**: `FLAME Reprographics Portal`
- **GCP Project ID**: `flame-reprographics-portal`
- **GCP Region**: `asia-southeast1` (Singapore)
- **Service Name**: `flame-reprographics`
- **Live Application URL**: **[https://flamereprographics.in](https://flamereprographics.in)**
- **Alternative URL**: **[https://www.flamereprographics.in](https://www.flamereprographics.in)**

---

## 🔑 Google OAuth 2.0 (Google SSO) Configuration

1. In the GCP Console for project `flame-reprographics-portal`, navigate to **APIs & Services** > **Credentials**.
2. Under Authorized JavaScript Origins, add:
   - `https://flamereprographics.in`
   - `https://www.flamereprographics.in`
3. Under Authorized Redirect URIs, add:
   - `https://flamereprographics.in/api/auth/callback/google`
   - `https://www.flamereprographics.in/api/auth/callback/google`

---

## 🚀 Deployment Command

```bash
gcloud run deploy flame-reprographics --source . --region asia-southeast1 --project flame-reprographics-portal --allow-unauthenticated --quiet
```
