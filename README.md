# Coffee POS — Man Coffee

SPA quản lý quầy cà phê: bàn đang mở, order, menu, dashboard doanh thu. Vue 3 ESM + Firebase Auth + Realtime Database (fallback `localStorage`). **Không build step** — mở `index.html` hoặc deploy GitHub Pages.

## Cấu trúc thư mục

```
Man_Coffee/
├── index.html                 # shell: CDN, #app, import js/app.js
├── css/
│   └── app.css                # style (ticket, stamp, AI chatbox…)
├── js/
│   ├── config.js              # FIREBASE_CONFIG + IMGBB_API_KEY
│   ├── firebase.js            # shared initializeApp (Auth + RTDB)
│   ├── db.js                  # Firebase / localStorage backend
│   ├── auth.js                # Firebase Auth (email/password)
│   ├── utils.js               # fmt, startOfDay/Week/Month
│   ├── app.js                 # createApp, auth gate, tabs, mount
│   ├── views/
│   │   ├── LoginView.js
│   │   ├── DashboardView.js
│   │   ├── TablesView.js
│   │   └── MenuView.js
│   └── components/
│       ├── AppHeader.js
│       ├── OpenTableModal.js
│       ├── OrderModal.js
│       ├── MenuModal.js
│       ├── ToastHost.js
│       └── AiChatbox.js       # FAB Gemini (API key localStorage)
└── README.md
```

CDN: Vue 3, Firebase, Chart.js, Tailwind, Font Awesome. Import tương đối (`./js/app.js`, `./views/...`).

## Chạy local

Mở `index.html` bằng trình duyệt (hoặc static server). Không cấu hình Firebase (`databaseURL` trống) → dữ liệu `localStorage` + session demo `{ username: 'local' }` (1 thiết bị, không Auth).

> Production / nhiều thiết bị: bắt buộc bật Firebase + Authentication + Rules bên dưới.

> Lưu ý: module ESM cần phục vụ qua HTTP (không phải `file://` trên một số trình duyệt). Có thể dùng `npx serve .` hoặc Live Server.

## Đăng nhập (Firebase Auth)

Mật khẩu **không** nằm trong repo — tạo user trên Firebase Console.

### 1. Bật Email/Password
Firebase Console → **Authentication → Sign-in method → Email/Password → Enable**.

### 2. Tạo user nhân viên
**Authentication → Users → Add user** — ví dụ `thuthuy@man.coffee` / mật khẩu mạnh; tương tự các nhân viên khác.

### 3. Realtime Database Rules
Khi đã dùng Auth, siết Rules (không còn mở public):

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

App chỉ `watch` RTDB **sau khi đăng nhập**. Header hiện phần trước `@` của email.

### Giới hạn thực tế
`FIREBASE_CONFIG.apiKey` vẫn public (bình thường với Firebase client). Bảo vệ thật sự đến từ **Auth + Rules**: người lạ không đọc/ghi RTDB nếu chưa login. Có thể bật App Check sau nếu cần siết thêm.

## Firebase Realtime Database (đồng bộ nhiều thiết bị)

### 1. Tạo project
https://console.firebase.google.com → **Add project**.

### 2. Tạo Realtime Database
**Build → Realtime Database → Create Database** → khu vực gần VN (Singapore).

> Sau khi bật Auth, dùng Rules `auth != null` ở trên (không để test mode mở mãi).

### 3. Lấy config Web
**Project settings → Your apps → Web `</>`** → copy `apiKey`, `authDomain`, `databaseURL`, `projectId`.

### 4. Dán vào `js/config.js`
```js
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "quan-cafe-pos.firebaseapp.com",
  databaseURL: "https://quan-cafe-pos-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quan-cafe-pos",
};
```

Paths RTDB: `menu`, `tables`, `sales`. Để trống `databaseURL` → fallback localStorage + session local.

## Trợ lý AI (Gemini chatbox)

FAB góc dưới phải (sau khi đăng nhập). Nhân viên tự dán **Gemini API key** trong app (bánh răng) — lưu `localStorage` key `cpos_gemini_key`.

1. Tạo key tại https://aistudio.google.com/apikey
2. Mở chatbox → bánh răng → dán key → **Lưu key** (có nút **Xóa** để gỡ).
3. **Không** commit key vào `js/config.js` hay repo.

Gọi `gemini-2.0-flash` (Google AI) với system prompt trợ lý quán cà phê / POS (tiếng Việt).

## Upload ảnh món (ImgBB)

Firebase Storage bắt buộc gói Blaze — app dùng **ImgBB** (API miễn phí) thay thế.

1. Tạo key tại https://api.imgbb.com
2. Dán vào [`js/config.js`](js/config.js):
```js
export const IMGBB_API_KEY = "YOUR_IMGBB_KEY";
```
3. Trong **Quản lý món → Thêm/Sửa món**: chọn file ảnh → preview → upload ImgBB → URL HTTPS ghi vào field `image` trên RTDB. Vẫn có ô **dán URL thủ công** nếu chưa có key hoặc upload lỗi.

Key nằm client-side (phù hợp app nội bộ). Không cấu hình key → vẫn dùng được bằng cách dán URL.

## Deploy GitHub Pages

Repo là HTML/JS/CSS tĩnh — không cần Vite/Webpack.

1. Push code lên GitHub.
2. **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` (hoặc `master`), folder: `/` (root)
3. Sau vài phút, site mở tại:
   `https://<user>.github.io/<repo>/`

Mở gốc repo → `index.html`. Các file `.js` import tương đối nên giữ nguyên cấu trúc thư mục khi deploy.

Tùy chọn khác: Firebase Hosting, Netlify Drop.

## Kiến trúc ngắn

- **Vue 3 ESM**: state reactive (`tables`, `menuItems`, `salesHistory`); đổi view bằng tab trong một SPA.
- **Firebase Auth** + shared `firebase.js`; RTDB chỉ sau login.
- **Firebase RTDB** = DB dùng chung; không cấu hình vẫn chạy localStorage (+ `BroadcastChannel` giữa các tab).
- **`salesHistory`**: đơn đã đóng — dashboard KPI/chart và lịch sử đóng bàn đọc từ đây.
- **AiChatbox**: Gemini key trên máy nhân viên (`localStorage`).
