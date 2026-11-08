# AR Portal PWA — Setup Guide

A fully static AR portal platform powered by **GitHub** (storage) + **Netlify** (hosting). No server required. 100% free.

## 🏗️ Architecture

```
GitHub Repo (ar-portal-pwa/)
├── models/          ← 3D model files (GLB, GLTF, OBJ, STL, DAE)
├── data/
│   └── portals.json ← Portal & model metadata
├── admin/           ← Admin panel (password-protected)
├── user/            ← Public viewer pages
├── css/             ← Stylesheets
├── js/
│   ├── app.js           ← Utility functions
│   ├── github-storage.js ← GitHub API integration
│   └── storage.js       ← Legacy (kept for compatibility)
└── index.html       ← Landing page
```

**How it works:**
1. Admin uploads model → GitHub API saves to `/models/` + updates `data/portals.json`
2. GitHub push triggers Netlify webhook → auto-redeploy (~30 seconds)
3. All users load from Netlify CDN → everyone sees the same content

---

## 🚀 Quick Start

### Step 1: Fork / Clone this Repo

```bash
git clone https://github.com/YOUR_USERNAME/ar-portal-pwa.git
cd ar-portal-pwa
```

Or click **Fork** on GitHub to get your own copy.

### Step 2: Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Choose **Deploy with GitHub** → select your `ar-portal-pwa` repo
3. Leave all build settings as default (this is a static site — no build command needed)
4. Click **Deploy site**
5. Netlify gives you a URL like `https://your-site-name.netlify.app`

> **Tip:** You can set a custom domain in Netlify → Site settings → Domain management.

### Step 3: Create a GitHub Personal Access Token

1. On GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set a name (e.g. "AR Portal Admin") and expiration
4. Under **Repository access** → select your `ar-portal-pwa` repo only
5. Under **Permissions → Repository permissions → Contents** → set to **Read and write**
6. Click **Generate token** — **copy it immediately** (shown only once!)

### Step 4: Configure Admin Panel

1. Open your Netlify URL and go to `/admin/index.html`
2. Login with password: `admin123` (change this in `admin/index.html` → `ADMIN_PASSWORD`)
3. Click **⚙️ Settings** in the navbar
4. Fill in:
   - **GitHub Username**: your GitHub username or org name
   - **Repository Name**: `ar-portal-pwa` (or your fork name)
   - **Branch**: `main`
   - **Personal Access Token**: paste the token from Step 3
5. Click **💾 Simpan Konfigurasi**
6. Click **🔌 Test Koneksi** to verify — should show "✅ Koneksi berhasil!"

### Step 5: Upload Models

1. Go to **Admin Panel → 📤 Upload Model**
2. Drag & drop or click to select a 3D file (GLB, GLTF, OBJ, STL, DAE)
3. GLB/GLTF files show a live preview using `<model-viewer>`
4. Fill in model name and optional description
5. Click **📤 Upload ke GitHub**
6. Wait for success message: "✅ Model berhasil diupload ke GitHub!"
7. Netlify auto-redeploys in ~30 seconds

### Step 6: Create Portals

1. Go to **Admin Panel → 🌐 Kelola Portal**
2. Click **+ Buat Portal Baru**
3. Fill in portal name and description
4. Check the models you want to include
5. Click **💾 Simpan** — portal is saved to GitHub

### Step 7: Share with Users

Share your Netlify URL. Users visit `/user/index.html` to browse portals and `/user/portal-view.html?id=PORTAL_ID` to view models in 3D and AR.

---

## 📱 AR Support

| Platform | Method | Requirement |
|----------|--------|-------------|
| Android  | WebXR / Scene Viewer | Chrome browser + ARCore |
| iOS      | Quick Look (USDZ) | Safari browser |

> **Note:** model-viewer's AR button appears automatically on supported devices. GLB models work best for AR.

---

## 🔐 Security Notes

- The admin password (`admin123`) is **client-side only** — change it in `admin/index.html`
- The GitHub Personal Access Token is stored in `localStorage` on the admin's browser only — never transmitted to any server other than the GitHub API directly
- For production, consider using environment variables or a lightweight serverless function for auth

---

## 📁 Supported Formats

| Format | Extension | model-viewer Support | AR Support |
|--------|-----------|---------------------|------------|
| glTF Binary | `.glb` | ✅ Full | ✅ Best |
| glTF JSON | `.gltf` | ✅ Full | ✅ Good |
| Wavefront | `.obj` | ✅ Limited | ⚠️ Limited |
| STL | `.stl` | ✅ Limited | ⚠️ Limited |
| Collada | `.dae` | ✅ Limited | ❌ No |

> **Recommendation:** Convert models to GLB for the best experience. Use [gltf.report](https://gltf.report/) or Blender for conversion.

---

## ⚙️ Configuration Files

### `data/portals.json`
Automatically managed by the admin panel. Structure:
```json
{
  "version": "1.0",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "models": [
    {
      "id": "abc123",
      "name": "My Model",
      "format": "glb",
      "filename": "1234567890_my_model.glb",
      "path": "models/1234567890_my_model.glb",
      "url": "https://raw.githubusercontent.com/owner/repo/main/models/...",
      "description": "Optional description",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "portals": [
    {
      "id": "def456",
      "name": "My Portal",
      "description": "Portal description",
      "modelIds": ["abc123"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 🛠️ Local Development

Since this is a fully static site, you can use any local server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8080`.

> **Note:** When running locally, model URLs from GitHub will still load correctly if GitHub is configured. The admin panel can upload directly to GitHub from local dev.

---

## 🔄 Updating the Admin Password

Open `admin/index.html` and find:
```javascript
const ADMIN_PASSWORD = 'admin123';
```
Change `admin123` to your desired password.

---

## 📞 Support

Built with:
- [Google model-viewer](https://modelviewer.dev/) — 3D & AR viewer
- [GitHub REST API](https://docs.github.com/en/rest) — File storage
- [Netlify](https://netlify.com) — Hosting & CDN
