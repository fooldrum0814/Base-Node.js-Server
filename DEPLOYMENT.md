# GCP 部署指南

本文件說明如何將baseserver Backend部署到Google Cloud Platform。

## 前置需求

1. **Google Cloud Account** - 有效的GCP帳戶
2. **Google Cloud SDK** - 安裝並設定gcloud CLI
3. **Docker** (可選) - 用於本地測試容器化部署

## 部署選項

### 選項1: App Engine (推薦用於簡單部署)

App Engine是GCP的完全託管平台，適合快速部署Node.js應用程式。

#### 步驟：

1. **初始化專案**
```bash
gcloud init
gcloud config set project YOUR_PROJECT_ID
```

2. **啟用App Engine API**
```bash
gcloud services enable appengine.googleapis.com
```

3. **部署應用程式**
```bash
gcloud app deploy
```

4. **查看部署結果**
```bash
gcloud app browse
```

#### 優點：
- 自動擴展
- 無需管理基礎設施
- 內建監控和日誌

### 選項2: Cloud Run (推薦用於容器化部署)

Cloud Run是無伺服器容器平台，提供更好的控制和靈活性。

#### 使用Cloud Build部署：

1. **啟用必要API**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

2. **使用Cloud Build部署**
```bash
gcloud builds submit --config cloudbuild.yaml
```

#### 手動Docker部署：

1. **建構Docker映像**
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/baseserver-backend .
```

2. **推送到Container Registry**
```bash
docker push gcr.io/YOUR_PROJECT_ID/baseserver-backend
```

3. **部署到Cloud Run**
```bash
gcloud run deploy baseserver-backend \
  --image gcr.io/YOUR_PROJECT_ID/baseserver-backend \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

## 環境變數設定

### App Engine環境變數

在`app.yaml`中設定：

```yaml
env_variables:
  NODE_ENV: production
  OPENAI_API_KEY: your_openai_api_key
  OPENAI_ASSISTANT_ID: your_assistant_id
  GCP_PROJECT_ID: your_project_id
  JWT_SECRET: your_jwt_secret
```

### Cloud Run環境變數

使用gcloud設定：

```bash
gcloud run services update baseserver-backend \
  --set-env-vars="NODE_ENV=production,OPENAI_API_KEY=your_key,OPENAI_ASSISTANT_ID=your_id"
```

或使用Secret Manager：

```bash
# 建立secret
gcloud secrets create openai-api-key --data-file=-
# 輸入您的API金鑰後按Ctrl+D

# 在Cloud Run中使用secret
gcloud run services update baseserver-backend \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest"
```

## 監控和日誌

### 查看日誌

```bash
# App Engine
gcloud app logs tail

# Cloud Run
gcloud run services logs tail baseserver-backend --region=asia-east1
```

### 設定監控

1. **啟用Cloud Monitoring**
```bash
gcloud services enable monitoring.googleapis.com
```

2. **設定告警**
- 在Cloud Console中進入Monitoring
- 建立告警政策
- 設定CPU使用率、記憶體使用率等指標

## 安全設定

### 1. 設定CORS

在生產環境中，更新CORS設定：

```javascript
app.use(cors({
  origin: ['https://your-mobile-app-domain.com'],
  credentials: true
}));
```

### 2. 設定防火牆規則

```bash
# 允許特定IP範圍
gcloud compute firewall-rules create allow-api-access \
  --allow tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --target-tags api-server
```

### 3. 使用HTTPS

App Engine和Cloud Run都自動提供HTTPS支援。

## 效能優化

### 1. 設定自動擴展

**App Engine (app.yaml):**
```yaml
automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6
```

**Cloud Run:**
```bash
gcloud run services update baseserver-backend \
  --min-instances=1 \
  --max-instances=10 \
  --cpu-throttling
```

### 2. 快取設定

考慮使用Cloud CDN或Redis進行快取：

```bash
# 啟用Cloud CDN
gcloud compute backend-services create api-backend \
  --global \
  --protocol HTTP \
  --port-name http \
  --health-checks api-health-check
```

## 資料庫整合

### 1. Cloud SQL (PostgreSQL/MySQL)

```bash
# 建立Cloud SQL實例
gcloud sql instances create baseserver-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=asia-east1
```

### 2. Firestore (NoSQL)

```bash
# 啟用Firestore API
gcloud services enable firestore.googleapis.com
```

## 持續部署 (CI/CD)

### 使用Cloud Build

1. **建立trigger**
```bash
gcloud builds triggers create github \
  --repo-name=baseserver-backend \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

2. **設定GitHub整合**
- 在GitHub中設定webhook
- 連接到Cloud Build trigger

### 使用GitHub Actions

建立`.github/workflows/deploy.yml`：

```yaml
name: Deploy to GCP

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to App Engine
      uses: google-github-actions/deploy-appengine@v0.2.0
      with:
        credentials: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
```

## 故障排除

### 常見問題

1. **部署失敗**
```bash
# 檢查日誌
gcloud app logs tail --service=default
```

2. **環境變數未設定**
```bash
# 檢查環境變數
gcloud app describe
```

3. **OpenAI API錯誤**
- 檢查API金鑰是否正確
- 確認API配額是否足夠
- 檢查網路連線

### 除錯工具

```bash
# 本地測試
npm run dev

# 測試Docker映像
docker run -p 8080:8080 gcr.io/YOUR_PROJECT_ID/baseserver-backend

# 檢查服務狀態
gcloud run services describe baseserver-backend --region=asia-east1
```

## 成本優化

### 1. 設定預算告警

```bash
# 建立預算
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="baseserver Budget" \
  --budget-amount=100USD
```

### 2. 使用預留實例

對於穩定的工作負載，考慮使用預留實例以降低成本。

### 3. 監控成本

定期檢查Cloud Console中的計費報告，識別成本優化機會。

## 備份和災難恢復

### 1. 資料備份

```bash
# Cloud SQL自動備份
gcloud sql instances patch baseserver-db \
  --backup-start-time=03:00 \
  --retained-backups-count=7
```

### 2. 多區域部署

考慮在多個區域部署以提高可用性：

```bash
# 部署到多個區域
gcloud run deploy baseserver-backend \
  --region=asia-east1,us-central1 \
  --image=gcr.io/YOUR_PROJECT_ID/baseserver-backend
```

## 支援和資源

- [GCP文件](https://cloud.google.com/docs)
- [App Engine文件](https://cloud.google.com/appengine/docs)
- [Cloud Run文件](https://cloud.google.com/run/docs)
- [Node.js on GCP](https://cloud.google.com/nodejs)
