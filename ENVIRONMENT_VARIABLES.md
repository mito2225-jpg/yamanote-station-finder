# 🔧 環境変数設定ガイド

## Railway（バックエンド）環境変数

### 設定場所
1. Railway.app → プロジェクト → **"Variables"** タブ

### 必要な環境変数
```
NODE_ENV = production
PORT = 3001
CORS_ORIGIN = *
```

### 設定手順
1. **"New Variable"** をクリック
2. 変数名と値を入力
3. **"Add"** をクリック
4. 3つの変数すべてを追加

---

## Vercel（フロントエンド）環境変数

### 設定場所
1. Vercel.com → プロジェクト → **"Settings"** → **"Environment Variables"**

### 必要な環境変数
```
VITE_API_BASE_URL = https://your-railway-url.railway.app/api
```

### 設定手順
1. **"Add New"** をクリック
2. Name: `VITE_API_BASE_URL`
3. Value: Railway の URL + `/api`
4. Environment: **"Production"** を選択
5. **"Save"** をクリック

---

## 🔄 URL の取得方法

### Railway URL の確認
1. Railway プロジェクト画面
2. **"Deployments"** タブ
3. 最新のデプロイをクリック
4. **"View Logs"** の隣にある URL をコピー

### Vercel URL の確認
1. Vercel プロジェクト画面
2. **"Visit"** ボタンの URL をコピー

---

## ⚠️ 重要な注意点

1. **Railway URL 例**: `https://yamanote-station-finder-production.up.railway.app`
2. **Vercel URL 例**: `https://yamanote-station-finder.vercel.app`
3. **API URL 例**: `https://yamanote-station-finder-production.up.railway.app/api`

## 🔄 最終更新手順

1. Railway デプロイ完了 → URL をコピー
2. Vercel の `VITE_API_BASE_URL` を Railway URL + `/api` に更新
3. Railway の `CORS_ORIGIN` を Vercel URL に更新
4. 両方のサービスで再デプロイ