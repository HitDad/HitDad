# Hướng dẫn dành cho Frontend Developer — CSE HitDad

Tài liệu này giúp thành viên mới hoặc dev frontend thiết lập môi trường, hiểu cấu trúc mã nguồn và nắm rõ quy trình làm việc của ứng dụng di động **HitDad**.

---

## 1. Công nghệ & yêu cầu môi trường

Dự án được khởi tạo trên **Expo SDK 58** với **Expo Router** và **TypeScript**:

| Thành phần | Phiên bản / Cấu hình hiện tại |
|---|---|
| Node.js | `24` (khai báo trong `.nvmrc`) |
| Package manager | `pnpm` (khóa phiên bản gói bằng `pnpm-lock.yaml`) |
| Expo | `~58.0.25` |
| Expo Router | `~58.0.31` (đã bật `typedRoutes` và `reactCompiler` trong `app.json`) |
| React / React Native | `19.3.0` / `0.88.1` |
| TypeScript | `~6.0.3` (`strict: true`) |
| Giao diện (Theme) | Hỗ trợ tự động Light / Dark (`"userInterfaceStyle": "automatic"`) |

> **Công cụ khuyến nghị:** Cài VS Code extension `expo.vscode-expo-tools` (đã gợi ý sẵn trong `.vscode/extensions.json`). Workspace có sẵn auto-fix & sắp xếp import khi lưu file trong `.vscode/settings.json`.

---

## 2. Thiết lập lần đầu & chạy ứng dụng

### Bước 1: Kiểm tra Node.js và `pnpm`

1. Kiểm tra phiên bản Node.js (ưu tiên đúng `v24.x` theo `.nvmrc`):
   ```bash
   node -v
   ```
2. Kiểm tra đã có `pnpm` chưa:
   ```bash
   pnpm -v
   ```
   Nếu máy báo chưa có lệnh `pnpm`, bật nhanh bằng Corepack đi kèm Node.js:
   ```bash
   corepack enable pnpm
   ```
   *(Lưu ý trên macOS dùng chip Intel đời cũ: không nên cài `pnpm` bằng `brew install pnpm` vì Homebrew có thể phải biên dịch lại nhiều gói phụ thuộc từ mã nguồn; hãy dùng `corepack enable pnpm` hoặc bộ cài chính thức của `pnpm`.)*

### Bước 2: Cài đặt dependencies

Tại thư mục gốc dự án, chạy:

```bash
pnpm install
```

> **Quan trọng:** Cả nhóm thống nhất chỉ dùng **`pnpm`**. Không chạy `npm install`, `yarn`, hay `bun install` và **không** tạo/commit thêm `package-lock.json` hay `yarn.lock`.

### Bước 3: Chạy dự án

Chọn 1 trong các lệnh sau tùy thiết bị bạn muốn test:

| Lệnh | Mục đích | Yêu cầu thêm |
|---|---|---|
| `pnpm start` | Mở Metro Dev Server (quét QR bằng **Expo Go** trên điện thoại thật) | Điện thoại & máy tính chung Wi-Fi, cài app Expo Go tương thích SDK 58 |
| `pnpm ios` | Mở app trên iOS Simulator | macOS đã cài Xcode & Simulator |
| `pnpm android` | Mở app trên Android Emulator / máy thật USB | Đã cài Android SDK / tạo AVD hoặc bật USB Debugging |
| `pnpm web` | Mở bản Web trên trình duyệt | `app.json` đang cấu hình `web.output: "server"` |

**Phím tắt hữu ích khi Metro đang chạy trong terminal:**
- `r`: Reload lại ứng dụng
- `m`: Mở Developer Menu
- `Ctrl + C`: Dừng server

---

## 3. Cấu trúc thư mục & quy ước code

```text
HitDad/
├── app.json                 # Cấu hình Expo (name, scheme, icons, plugins, experiments)
├── package.json             # Scripts & dependencies
├── pnpm-lock.yaml           # Lockfile bắt buộc giữ đồng bộ trên Git
├── tsconfig.json            # Path aliases (@/*, @/assets/*) & strict TS
├── eslint.config.js         # Cấu hình ESLint theo chuẩn Expo
├── assets/                  # Hình ảnh, app icon, splash screen
├── scripts/
│   └── reset-project.js     # Script dọn starter template (chỉ chạy khi cả nhóm thống nhất)
└── src/
    ├── app/                 # CHỈ chứa screens và _layout.tsx (Expo Router)
    │   ├── _layout.tsx      # Root layout (ThemeProvider, AnimatedSplashOverlay, AppTabs)
    │   ├── index.tsx        # Màn hình chính hiện tại (starter template)
    │   └── explore.tsx      # Màn hình tab thứ hai (starter template)
    ├── components/          # UI components dùng chung (và biến thể .web.tsx nếu cần)
    ├── constants/
    │   └── theme.ts         # Design tokens: Colors, Fonts, Spacing, BottomTabInset, MaxContentWidth
    ├── hooks/               # Custom hooks (use-theme, use-color-scheme, ...)
    └── global.css           # Biến CSS font cho nền tảng Web
```

### Quy tắc tổ chức code bắt buộc

1. **Routing với Expo Router (`src/app/`):**
   - Mọi file trong `src/app/` đều được xem là một route/screen hoặc layout (`_layout.tsx`).
   - **Không** đặt component, hook, API client hay hàm tiện ích vào `src/app/` — hãy đặt ở `src/components/`, `src/hooks/`, `src/constants/`, hoặc tạo thư mục riêng bên ngoài `src/app/` (ví dụ `src/services/`, `src/utils/`, `src/types/`).
   - Điều hướng và đọc params bằng `Link`, `router`, `useLocalSearchParams` từ `expo-router`.
2. **Import với Path Alias (đã cấu hình trong `tsconfig.json`):**
   - Dùng `@/` cho thư mục `src/` (ví dụ: `import { Colors } from '@/constants/theme';`).
   - Dùng `@/assets/` cho thư mục `assets/`.
3. **Ưu tiên thiết kế mobile-first & hỗ trợ cả Light/Dark mode:**
   - Sử dụng `Colors`, `Spacing`, `Fonts` trong `src/constants/theme.ts` (hoặc design tokens đã thống nhất của nhóm) và `useTheme` / `ThemedText` / `ThemedView` thay vì hard-code màu sắc.
   - Đảm bảo thao tác mượt trên cả iOS và Android, tránh tràn màn hình nhỏ (`SafeAreaView`, `useSafeAreaInsets`).
4. **Không tự ý chạy `pnpm reset-project`:**
   - Script `scripts/reset-project.js` dùng để xóa/di chuyển code mẫu trong `src/` sang `example/`. Chỉ chạy khi nhóm đã thống nhất làm sạch khung khởi tạo.

---

## 4. Cài thêm thư viện & xử lý cấu hình Native

- **Luôn dùng Expo CLI để cài thư viện mới** nhằm chọn đúng phiên bản tương thích với Expo SDK 58:
  ```bash
  pnpm expo install <ten-goi>
  ```
  Tránh dùng `pnpm add <ten-goi>` cho các gói React Native / Expo vì có thể lệch phiên bản SDK.
- **Ưu tiên các module chính thức của Expo** (SDK 58) trước khi cài thư viện bên thứ ba. Lưu ý: API của Expo thay đổi qua từng phiên bản, hãy đối chiếu tài liệu đúng SDK 58 tại [docs.expo.dev/versions/v58.0.0](https://docs.expo.dev/versions/v58.0.0/).
- **Không tạo hoặc sửa tay thư mục `ios/` và `android/`:**
  - Hai thư mục này đang được ignore trong `.gitignore` (dùng cơ chế Continuous Native Generation). Mọi cấu hình quyền truy cập, splash, icon, plugin đều cấu hình trong `app.json`.
- **Lưu ý Expo Go vs Development Build:**
  - Hiện tại các gói mặc định chạy thẳng trên **Expo Go**.
  - Nếu về sau cần cài thư viện có native code tùy biến không nằm trong Expo Go, cả nhóm sẽ cần build Development Client (`pnpm expo run:ios` / `pnpm expo run:android` hoặc `eas build --profile development`).
- **Ghi chú kỹ thuật cho `pnpm`:**
  - Trên Expo SDK 58, cấu trúc `node_modules/.pnpm` mặc định hoạt động bình thường với Metro. Chỉ khi về sau thêm thư viện native bên thứ ba gặp lỗi không tìm thấy module lúc build/bundle, mới cần cân nhắc thêm `node-linker=hoisted` vào `.npmrc`.

---

## 5. Checklist trước khi mở Pull Request

Mỗi khi hoàn thành task, chạy đầy đủ các kiểm tra sau trước khi đẩy branch lên GitHub:

1. **Kiểm tra kiểu TypeScript:**
   ```bash
   pnpm exec tsc --noEmit
   ```
2. **Kiểm tra ESLint:**
   ```bash
   pnpm lint
   ```
3. **Kiểm tra sức khỏe cấu hình & dependencies Expo (khi có thêm/sửa gói):**
   ```bash
   pnpm dlx expo-doctor
   ```
4. **Test chạy thực tế:**
   - Mở thử trên iOS Simulator / Android Emulator / Expo Go (và Web nếu màn hình có hỗ trợ).
   - Kiểm tra hiển thị ở cả **Light Mode** và **Dark Mode**.
5. **Kiểm tra file thay đổi (`git status`):**
   - Đảm bảo không commit file rác hoặc file cấu hình cá nhân bị ignore (`node_modules/`, `.expo/`, `dist/`, `.env*.local`, `package-lock.json`, `ios/`, `android/`).
   - Nếu có cài thêm package, nhớ commit cả `package.json` và `pnpm-lock.yaml`.
   - Đảm bảo `pnpm exec tsc --noEmit` và `pnpm lint` đều pass sạch (0 lỗi) trước khi tạo PR.

---

## 6. Quy trình làm việc Git trong nhóm

1. Nhận phân công từ **GitHub Issue** và cập nhật trạng thái trên **GitHub Project**:
   `Backlog → To Do → In Progress → Review → Done`.
2. Tạo branch mới từ `main` trước khi code (không commit/push trực tiếp lên `main`), đặt tên rõ theo tính năng/issue (ví dụ: `feat/session-voting`, `fix/checkin-list`).
3. Sau khi pass checklist ở mục 5, tạo **Pull Request**, gắn link Issue tương ứng và chuyển trạng thái sang **Review**.
4. Bám sát đặc tả luồng MVP và thiết kế UI/UX của nhóm trên GitHub Wiki và trong `docs/ass2/assignment-2-full-guide.md`.

---

## 7. Xử lý một số lỗi thường gặp

- **App không nhận thay đổi route, assets hoặc bị lỗi cache Metro:**
  ```bash
  pnpm start --clear
  ```
- **Lỗi thiếu module hoặc sai phiên bản sau khi `git pull`:**
  ```bash
  pnpm install
  ```
- **Máy báo `pnpm: command not found`:**
  Kiểm tra lại Node `24` đã active chưa (`node -v`), sau đó chạy `corepack enable pnpm`.
- **Quét QR Expo Go trên điện thoại thật không kết nối được:**
  Kiểm tra điện thoại và máy tính đang cùng mạng Wi-Fi (hoặc dùng chế độ tunnel khi cần: `pnpm start --tunnel`).
