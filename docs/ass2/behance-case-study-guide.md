# Behance Product Design Case Study — CSE HitDad (Blueprint 10 phần)

> Tài liệu này thiết kế sẵn nội dung trình bày chuyên nghiệp (dạng portfolio, súc tích, không lặp lại văn bản dài dòng từ GitHub Wiki) theo đúng cấu trúc khuyến nghị 10 phần ở **Mục 3.6** của đề Assignment 2. Toàn bộ ảnh minh họa đã xuất sẵn trong [`landing-page/assets/`](../../landing-page/assets/).

---

## Thông tin thiết lập Project trên Behance
- **Published URL:** https://www.behance.net/gallery/258941175/CSE-HitDad-Mobile-App-for-Football-Club-Coordination
- **Project Title:** `CSE HitDad — Mobile App for Football Club Coordination`
- **Project Tags:** `Mobile App Design`, `UI/UX`, `Product Design`, `Design System`, `Figma Prototype`, `Sports Tech`
- **Tools Used:** `Figma`, `Google Fonts (Barlow Condensed & Be Vietnam Pro)`
- **Cover Image có sẵn:** Dùng trực tiếp file [`docs/ass2/behance-slides/00-cover.png`](./behance-slides/00-cover.png) (`1400 × 1096 px`, đã ghép sẵn 3 màn hình nổi trên nền gradient HitDad).
- **Bộ Slide trình bày 1400px đã ghép sẵn trong [`docs/ass2/behance-slides/`](./behance-slides/):**
  - `00-cover.png` — Ảnh bìa (Cover Image) & Mở đầu Case Study
  - `07a-screens-vote-roster.png` — Cụm màn hình Lịch đá, Vote giờ, Admin tạo kèo & Thành viên CLB
  - `07b-screens-checkin-payment.png` — Cụm màn hình Chia đội bản nháp, Check-in tại sân, Chi phí & VietQR
  - `07c-screens-edge-states.png` — Cụm màn hình Lỗi xác thực, Mất mạng 4G & Thông báo trống
  - `09-before-after-checkin.png` — Bảng so sánh Before → After từ Usability Test `P01–P02`
  - Kèm bảng Design System: [`landing-page/assets/00-design-system.png`](../../landing-page/assets/00-design-system.png)

---

## 1. Product Overview
- **Tiêu đề khối:** `01 · Product Overview`
- **Nội dung ngắn gọn (copy lên Behance):**
  > **CSE HitDad** là ứng dụng di động giúp câu lạc bộ bóng đá nội bộ (quy mô 30–40 thành viên) điều phối trọn vẹn vòng đời một trận đấu: bình chọn khung giờ, điểm danh tại sân, chia đội cân bằng theo kỹ năng và chốt tiền sân qua VietQR — thay thế quy trình thủ công rời rạc trên Messenger và Excel.
- **Role / Timeline / Scope:** `5-member Student Team (CO3043) · Assignment 2: Product Design, Design System & Interactive Validation`.

## 2. Problem Statement & Target Users
- **Tiêu đề khối:** `02 · Problem Statement & Target Users`
- **Gợi ý trình bày trực quan (3 cột + 2 Persona cards):**
  - **Trước trận:** Poll Messenger bị trôi tin nhắn, chủ kèo phải đếm thủ công quân số & người báo bận để chốt sân.
  - **Tại sân:** Mất 15–20 phút đầu giờ để điểm danh và chia đội cho cân bằng thủ môn & trình độ; người xin nghỉ sát giờ làm xáo trộn đội hình.
  - **Sau trận:** Chia nhầm tiền sân/nước/bib và chủ kèo ngại nhắc chuyển khoản từng người.
  - **Target Users:**
    1. **Chủ kèo / Ban cán sự CLB:** Đặt sân, lập danh sách, cân đội và thu chi.
    2. **Thành viên CLB:** Sinh viên / cựu sinh viên tham gia đá bóng định kỳ hàng tuần.

## 3. Unique Value Proposition (UVP)
- **Tiêu đề khối:** `03 · Unique Value Proposition`
- **Headline lớn:** *"Chốt kèo nhanh · Chia đội chuẩn · Sòng phẳng tiền sân — ngay trên điện thoại ngoài sân bóng."*
- **3 điểm khác biệt cốt lõi:**
  1. **Không thay thế app chat, tập trung đúng nghiệp vụ:** Chỉ mở app để chốt giờ, xem đội, check-in và thanh toán dưới 3 phút.
  2. **Chia đội công bằng minh bạch:** Cân đội tự động/bản nháp theo hạng kỹ năng (`S / A / B / C / D / Mới`) và phân bổ `Thủ môn`.
  3. **Sòng phẳng từng nghìn đồng:** Chia đều trực tiếp theo số người thực tế `check-in` kèm mã VietQR có sẵn nội dung đối soát.

## 4. Key Design Decisions
- **Tiêu đề khối:** `04 · Key Design Decisions`
- **Trình bày 4 quyết định thiết kế quan trọng (kèm lý do UX):**
  1. **Thumb-Zone Ergonomics & Quick-Select Chips:** Đặt nút chính cao `50px` ở thanh đáy (`93px`) và dùng Bottom Sheet chọn nhanh lý do vắng (`Bận học/thi`, `Kẹt xe`, `Ốm/chấn thương`) để thành viên thao tác bằng 1 tay mà không cần gõ phím khi đang di chuyển.
  2. **Draft-First Team Allocation (`02f Admin`):** Admin có thể xem trước bản nháp chia đội và duyệt đơn xin nghỉ sát giờ trước khi công bố cho cả CLB.
  3. **Forgiving Check-in & Offline Recovery:** Hỗ trợ `Check-in nhầm? Hoàn tác` và thẻ khôi phục ngoại tuyến `Thử lại ngay` khi sóng 4G tại sân cỏ nhân tạo bị chập chờn.
  4. **High-Contrast Sports Typography:** Kết hợp `Barlow Condensed Bold` (con số ngày đá, số tiền cỡ lớn dễ đọc ngoài trời) và `Be Vietnam Pro` tối ưu hiển thị tiếng Việt.

## 5. User Flows
- **Tiêu đề khối:** `05 · Core User Flows`
- **Ảnh / Sơ đồ cần đưa lên:** Chụp sơ đồ 5 luồng (`FLOW 1` → `FLOW 5`) từ canvas `HitDad · Screens` hoặc xuất từ 3 sơ đồ luồng trên GitHub Wiki:
  - *Flow 1:* Đăng nhập / Đăng ký & Xử lý lỗi xác thực (`00a → 00a-err → 00b → 01`).
  - *Flow 2:* Lịch đá, Tạo kèo & Bình chọn khung giờ (`01 → 02 → Overlay Lý do → 02c`).
  - *Flow 3:* Chia đội, Duyệt xin nghỉ & Check-in tại sân (`02e → 02f Admin → 02f-1 → 02f-2 → 02f-err → 02f-3`).
  - *Flow 4:* Chốt chi phí & Thanh toán VietQR (`02g → 03 → 03c Đang xác nhận → 03b Đã trả`).

## 6. Design System
- **Tiêu đề khối:** `06 · Design System & Component Library`
- **Ảnh chèn trực tiếp:** Dùng file [`landing-page/assets/00-design-system.png`](../../landing-page/assets/00-design-system.png) (bảng `00 · HitDad Design System & Foundations` đã tạo ở trang `HitDad · Components`), kèm 1 đoạn giải thích ngắn về hệ thống 40+ Components/Variants & Variables áp dụng xuyên suốt.

## 7. Selected Application Screens & Interaction Flows
- **Tiêu đề khối:** `07 · High-Fidelity Screens & Edge States`
- **Chèn thẳng 3 ảnh slide đã ghép sẵn (`1400px`) từ [`docs/ass2/behance-slides/`](./behance-slides/) theo thứ tự:**
  1. `07a-screens-vote-roster.png` *(Lịch đá, Vote khung giờ, Admin tạo trận & Thành viên CLB)*.
  2. `07b-screens-checkin-payment.png` *(Chia đội bản nháp, Mở Check-in tại sân, Chi phí & VietQR)*.
  3. `07c-screens-edge-states.png` *(Trạng thái Lỗi xác thực, Mất mạng 4G & Thông báo trống)*.

## 8. Usability Testing Findings
- **Tiêu đề khối:** `08 · Usability Testing Findings`
- **Nội dung copy thẳng lên Behance (theo kết quả thực tế P01–P03):**
  - *Phương pháp & Đối tượng:* Đánh giá trực tiếp trên Figma Interactive Prototype với **3 người dùng đại diện ngoài nhóm dự án (`P01`, `P02`, `P03`)** qua **4 tác vụ đại diện (`UT-01` → `UT-04`)** thực hiện ngày 20–21/11/2026.
  - *Kết quả hoàn thành:* `P01`, `P02`, `P03` hoàn thành trơn tru các tác vụ Vote/Báo vắng (`UT-01`), Xin nghỉ (`UT-03`) và Chốt bill/VietQR (`UT-04`) (`3/3`). Riêng `UT-02` (Điểm danh tại sân) ghi nhận **2/3 người (`P01`, `P02`) bị khựng**.
  - *Các phát hiện chính (Key Insights):*
    1. **Thiếu luồng thành viên tự Check-in tại sân (`P01`, `P02`):** Giao diện lúc test mới chỉ hiển thị thanh đáy bị khóa (*"Mở check-in lúc 18:00"*), khiến người dùng thắc mắc làm sao tự điểm danh và xử lý khi bấm nhầm.
    2. **Chưa thấy xử lý sự cố ngoài sân (`P02`):** Người dùng góp ý cần có màn hình phản hồi khi kết nối 4G tại sân bị lỗi lúc thao tác.
    3. **Điểm cộng lớn ở khâu chia tiền (`P03`):** Người từng đứng ra thu tiền sân cho CLB đánh giá cao tính minh bạch của công thức chia đầu người và mã VietQR có sẵn nội dung đối soát.

## 9. Design Improvements & Iterations
- **Tiêu đề khối:** `09 · Design Improvements (Before vs. After)`
- **Chèn trực tiếp ảnh so sánh đã ghép sẵn:** [`docs/ass2/behance-slides/09-before-after-checkin.png`](./behance-slides/09-before-after-checkin.png)
- **Tóm tắt copy kèm bên dưới ảnh:**
  - **Iteration 1 (Check-in State & Undo — Từ góp ý `P01–P02`):** Bổ sung `02f-2 Đang mở Check-in` (nút `#1546C8` vùng ngón cái) và `02f-3 Đã Check-in` kèm liên kết `Check-in nhầm? Hoàn tác`.
  - **Iteration 2 (Offline Recovery at Pitch — Từ góp ý `P02`):** Bổ sung `02f-err` lưu tạm dữ liệu check-in khi mất mạng 4G ngoài sân và nút `Thử lại ngay`.
  - **Iteration 3 (System & Edge States):** Bổ sung `00a-err` (báo lỗi mật khẩu) và `09b` (Empty State đồng bộ `0 chưa đọc` / `Chưa đọc 0`).
  - *Xác nhận lại:* Sau khi cập nhật trên Figma, `P01` và `P02` xác nhận luồng tự check-in và xử lý sự cố mạng đã đáp ứng đúng kỳ vọng sử dụng.

## 10. Interactive Prototype & Links
- **Tiêu đề khối:** `10 · Interactive Prototype & Project Links`
- **Nhúng trực tiếp Figma Prototype trên Behance** (trong trình soạn thảo Behance chọn **Embed** và dán đoạn mã `<iframe>` dưới đây — nhớ bật quyền `Anyone with the link can view` trên file Figma trước):
  ```html
  <iframe
    style="border: 1px solid rgba(0, 0, 0, 0.1);"
    width="100%"
    height="640"
    src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FfGXYmJMlxPStGfv1ouUuDe%2FFigma-HitDad%3Fnode-id%3D1-274%26scaling%3Dscale-down%26content-scaling%3Dfixed%26starting-point-node-id%3D1%253A274"
    allowfullscreen>
  </iframe>
  ```
- **Các đường dẫn đính kèm cuối bài Behance:**
  - Interactive Figma Prototype: `https://www.figma.com/proto/fGXYmJMlxPStGfv1ouUuDe/Figma-HitDad?node-id=1-274&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1%3A274`
  - Figma Design File: `https://www.figma.com/design/fGXYmJMlxPStGfv1ouUuDe/Figma-HitDad?node-id=1-273`
  - Product Landing Page: `https://cse-hitdad.vercel.app`
  - GitHub Wiki & Project: `https://github.com/HitDad/HitDad/wiki` · `https://github.com/orgs/HitDad/projects/1`
