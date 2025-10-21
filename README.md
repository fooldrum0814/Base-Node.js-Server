# Node.js Backend Server

一個基於Node.js的後端伺服器，整合OpenAI Assistant API，提供RESTful API供mobile app使用，並支援部署到Google Cloud Platform (GCP)。

## 功能特色

- 🚀 **Express.js框架** - 快速、靈活的Node.js web框架
- 🤖 **OpenAI Assistant整合** - 完整的OpenAI Assistant API支援
- 📱 **RESTful API** - 為mobile app設計的API端點
- 🔒 **安全性** - 包含CORS、Helmet、Rate Limiting等安全措施
- 📊 **日誌記錄** - 使用Winston進行結構化日誌記錄
- ☁️ **GCP部署** - 支援App Engine和Cloud Run部署
- 🐳 **Docker支援** - 容器化部署選項

## 專案結構

```
BaseServer/
├── src/
│   ├── app.js                 # 主應用程式入口
│   ├── middleware/           # 中介軟體
│   │   ├── errorHandler.js   # 錯誤處理
│   │   └── validation.js     # 驗證中介軟體
│   ├── routes/               # API路由
│   │   ├── api.js           # 主要API路由
│   │   ├── user.js          # 用戶相關路由
│   │   ├── chat.js          # 聊天相關路由
│   │   └── openai.js        # OpenAI相關路由
│   ├── services/             # 服務層
│   │   └── openaiService.js  # OpenAI服務
│   └── utils/                # 工具函數
│       └── logger.js         # 日誌工具
├── logs/                     # 日誌檔案目錄
├── package.json             # 專案依賴
├── app.yaml                 # GCP App Engine配置
├── Dockerfile               # Docker配置
├── cloudbuild.yaml          # Cloud Build配置
└── README.md                # 專案說明
```

## 安裝與設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數設定

複製 `env.example` 並重新命名為 `.env`，然後填入您的配置：

```bash
cp env.example .env
```

編輯 `.env` 檔案：

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here

# GCP Configuration
GCP_PROJECT_ID=your_gcp_project_id
GCP_REGION=asia-east1

# Security
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT=100
```

### 3. 建立日誌目錄

```bash
mkdir logs
```

## 開發

### 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動

### 啟動生產伺服器

```bash
npm start
```

## API 端點

### 健康檢查
- `GET /health` - 伺服器健康狀態
- `GET /api/health` - API健康狀態

### 用戶管理
- `GET /api/v1/users` - 取得所有用戶
- `GET /api/v1/users/:id` - 取得特定用戶
- `POST /api/v1/users` - 建立新用戶
- `PUT /api/v1/users/:id` - 更新用戶
- `DELETE /api/v1/users/:id` - 刪除用戶

### 聊天功能
- `POST /api/v1/chat` - 發送聊天訊息
- `GET /api/v1/chat/history/:threadId` - 取得聊天歷史
- `GET /api/v1/chat/thread/:threadId` - 取得對話串詳情
- `POST /api/v1/chat/thread` - 建立新對話串
- `DELETE /api/v1/chat/thread/:threadId` - 刪除對話串

### OpenAI 整合
- `POST /api/openai/chat` - 與OpenAI Assistant聊天
- `POST /api/openai/thread` - 建立新OpenAI對話串
- `GET /api/openai/thread/:threadId/messages` - 取得對話串訊息
- `POST /api/openai/thread/:threadId/message` - 新增訊息到對話串

## 部署到GCP

### 方法1: App Engine部署

1. 安裝Google Cloud SDK
2. 初始化gcloud並設定專案：

```bash
gcloud init
gcloud config set project YOUR_PROJECT_ID
```

3. 部署到App Engine：

```bash
gcloud app deploy
```

### 方法2: Cloud Run部署

1. 使用Cloud Build部署：

```bash
gcloud builds submit --config cloudbuild.yaml
```

2. 或使用Docker直接部署：

```bash
# 建構映像
docker build -t gcr.io/YOUR_PROJECT_ID/baseserver-backend .

# 推送到Container Registry
docker push gcr.io/YOUR_PROJECT_ID/baseserver-backend

# 部署到Cloud Run
gcloud run deploy baseserver-backend \
  --image gcr.io/YOUR_PROJECT_ID/baseserver-backend \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated
```

## 環境變數說明

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `PORT` | 伺服器端口 | 3000 |
| `NODE_ENV` | 環境模式 | development |
| `OPENAI_API_KEY` | OpenAI API金鑰 | - |
| `OPENAI_ASSISTANT_ID` | OpenAI Assistant ID | - |
| `GCP_PROJECT_ID` | GCP專案ID | - |
| `GCP_REGION` | GCP區域 | asia-east1 |
| `JWT_SECRET` | JWT密鑰 | - |
| `API_RATE_LIMIT` | API速率限制 | 100 |

## 安全功能

- **CORS保護** - 限制跨域請求
- **Helmet** - 設定安全HTTP標頭
- **Rate Limiting** - API請求速率限制
- **輸入驗證** - 使用express-validator驗證輸入
- **錯誤處理** - 統一的錯誤處理機制

## 日誌記錄

應用程式使用Winston進行結構化日誌記錄：

- 錯誤日誌：`logs/error.log`
- 綜合日誌：`logs/combined.log`
- 開發環境：同時輸出到控制台

## 測試

```bash
npm test
```

## 程式碼檢查

```bash
npm run lint
npm run lint:fix
```

## 貢獻

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟Pull Request

<!-- ## 授權 -->

<!-- 此專案使用MIT授權 - 詳見 [LICENSE](LICENSE) 檔案 -->

## 聯絡資訊

信箱 - [cool24583185@gmail.com](mailto:cool24583185@gmail.com)
