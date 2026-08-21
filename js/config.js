/* =====================================================================
 * FIREBASE CONFIG — điền thông tin project của bạn vào đây để bật
 * đồng bộ real-time giữa nhiều thiết bị. Để trống databaseURL thì app
 * tự chạy ở "chế độ 1 thiết bị" bằng localStorage.
 * Xem hướng dẫn lấy config trong README.md.
 * ================================================================== */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAH1LTyAB5YvcXbn1-kQxMgxHoNqYDCy4A",
  authDomain: "quan-cafe-pos.firebaseapp.com",
  databaseURL: "https://quan-cafe-pos-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quan-cafe-pos",
};

export const FIREBASE_ENABLED = !!FIREBASE_CONFIG.databaseURL;

/* ImgBB API key — lấy tại https://api.imgbb.com (upload ảnh món, tùy chọn) */
export const IMGBB_API_KEY = "";
