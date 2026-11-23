# Assignment 2 — Cập nhật GitHub Wiki, Usability Testing & Khai báo AI

> Tài liệu tổng hợp toàn bộ nội dung cần cập nhật lên **[GitHub Wiki](https://github.com/HitDad/HitDad/wiki)** và **[GitHub Project](https://github.com/orgs/HitDad/projects/1)** để đáp ứng đầy đủ **Mục 3.1**, **Mục 3.5**, **Mục 5** và **Mục 6** của đề **Assignment 2 (CO3043)**.

---

## Phần 1 · Product Refinement & MVP Alignment (Mục 3.1)

### 1.1. Rà soát bài toán, đối tượng mục tiêu & UVP
- **Problem Statement:** Các câu lạc bộ bóng đá nội bộ (~30–38 thành viên) gặp tình trạng rời rạc xuyên suốt ba giai đoạn trận đấu:
  1. *Trước trận:* Poll bình chọn trên Messenger dễ trôi tin, chủ kèo phải đếm thủ công quân số tham gia và người báo bận.
  2. *Tại sân:* Điểm danh và chia đội cho cân bằng trình độ + thủ môn mất 15–20 phút đầu giờ; xử lý người xin nghỉ sát giờ gây rối đội hình.
  3. *Sau trận:* Chia tiền sân, nước, áo bib dễ nhầm theo số người đi thực tế và chủ kèo ngại nhắc chuyển khoản từng thành viên.
- **Target Users:**
  1. **Chủ kèo / Ban cán sự CLB (Organizer/Admin):** Tạo kèo, chốt giờ, sắp đội hình, duyệt xin nghỉ và đối soát thanh toán.
  2. **Thành viên CLB (Player/Member):** Sinh viên và cựu sinh viên tham gia đá giao lưu định kỳ hàng tuần.
- **Unique Value Proposition (UVP):** Khép kín vòng đời một trận đấu bóng đá CLB (*Vote khung giờ → Chia đội cân bằng → Check-in tại sân → Chốt bill VietQR*) ngay trên di động với thao tác ngắn gọn, giảm gõ phím khi di chuyển và ngoài sân bóng.

### 1.2. Bảng đối chiếu nhất quán MVP ↔ User Flows ↔ Figma Screens

| MVP Feature | Updated User Flow (Figma) | Màn hình đại diện trên Figma | Trạng thái hỗ trợ |
| :--- | :--- | :--- | :--- |
| **F01 · Đăng nhập & Hồ sơ CLB** | Flow 1: Đăng nhập & Xác thực | `00a Đăng nhập`, `00b Đăng ký tài khoản`, `00a-err`, `04 Thành viên CLB`, `05 Tài khoản` | Default, Active, Input Validation Error |
| **F02 · Tạo trận & Vote khung giờ** | Flow 2: Lịch đá, Tạo kèo & Bình chọn giờ | `01 Lịch đá`, `01 Tab Đã đá`, `02 Chi tiết trận`, `02 Overlay – Lý do không tham gia`, `02c Không tham gia`, `06 Tạo trận đấu – Admin` | Default, Voting, Closed, Quick-Select Chips, Empty |
| **F03 · Chia đội & Duyệt xin nghỉ** | Flow 3: Chia đội, Xin nghỉ & Check-in | `02e Chờ chia đội`, `02f Admin – Chia đội (chưa công bố)`, `02f-1 Đã chia đội`, `02f Overlay – Xin nghỉ`, `02f Chờ duyệt nghỉ` | Waiting, Draft (Admin), Published, Pending Leave Approval |
| **F04 · Điểm danh tại sân (Check-in)** | Flow 3: Check-in tại sân & Khôi phục lỗi | `02f-1` (Chưa mở), `02f-2 Đang mở Check-in`, `02f-3 Đã Check-in (Hoàn tác)`, `02f-err Lỗi mạng` | Disabled, Active, Success + Undo, Offline Recovery |
| **F05 · Chia tiền sân & VietQR** | Flow 4: Chốt bill & Thanh toán VietQR | `02g Đã đá – Chờ thanh toán`, `02h Đã trả`, `03 Thanh toán VietQR`, `03c Đang xác nhận`, `03b Đã trả` | Pending Payment, Verifying, Confirmed/Paid |
| **F06 · Thông báo trận đấu** | Flow 5: Quản lý CLB & Thông báo | `01 Lịch đá – Thông báo đẩy`, `09 Thông báo`, `09b Trạng thái trống` | Unread List, Push Preview, Empty State (`0 chưa đọc`) |

### 1.3. Giải thích các thay đổi quan trọng so với Assignment 1 (Justification of Significant Changes)

1. **Bổ sung cơ chế Bản nháp chia đội cho Admin (`02f Admin`) và luồng Xin nghỉ sau khi chia đội (`02f Overlay – Xin nghỉ`, `02f Chờ duyệt nghỉ`):**
   - *Lý do:* Ở Assignment 1, luồng chia đội được mô tả tuyến tính tại sân. Khi rà soát thực tế vận hành kèo, chủ kèo thường chia đội trước giờ bóng lăn để công bố trước cho anh em biết áo bib/thủ môn, nhưng vẫn phát sinh người xin nghỉ đột xuất. Việc tách trạng thái *Bản nháp* và *Yêu cầu xin nghỉ cần duyệt* giúp giữ nguyên sự rõ ràng về trách nhiệm tiền sân cho tới khi chủ kèo xác nhận người thay.
2. **Mở rộng thanh Check-in thành 4 trạng thái (`Chưa mở → Đang mở → Đã check-in có Hoàn tác → Đã khóa`) kèm màn hình Lỗi mạng (`02f-err`):**
   - *Lý do:* Sóng 4G tại nhiều sân bóng ngoài trời thường chập chờn và người dùng dễ bấm nhầm nút khi đang di chuyển. Bổ sung trạng thái `Hoàn tác` và `Offline Recovery (Thử lại ngay)` giúp đảm bảo dữ liệu điểm danh dùng làm căn cứ chia tiền sân không bị sai lệch.
3. **Thay thế việc gõ văn bản dài bằng Quick-Select Chips (`Bận học/thi`, `Ốm/chấn thương`, `Kẹt xe`, `Thời tiết xấu`):**
   - *Lý do:* Tuân thủ nguyên tắc thiết kế Mobile-First (giảm thiểu nhập liệu bàn phím). Thành viên chỉ cần 2 chạm để báo vắng thay vì bỏ qua không phản hồi.
4. **Tách rõ 3 trạng thái thanh toán VietQR (`Chưa trả` → `Đang xác nhận` → `Đã trả`):**
   - *Lý do:* Trong Assignment 1, nhóm đã nhận diện rủi ro nhầm lẫn giữa việc thành viên tự báo đã chuyển khoản và tiền thực sự về tài khoản chủ kèo. Màn hình `03c Đang xác nhận` thông báo rõ *"Đang chờ tiền về tài khoản admin — Thường mất dưới 1 phút"* giúp thành viên yên tâm thoát màn hình mà không chuyển khoản nhầm 2 lần.

---

## Phần 2 · Usability Testing Plan & Design Iteration (Mục 3.5 — 15% tổng điểm)

> **Lưu ý triển khai bắt buộc:** Theo mục 3.5 của đề Assignment 2, nhóm cần mời **ít nhất 3 người tham gia bên ngoài nhóm dự án** (ưu tiên người có thói quen đi đá bóng phủi / CLB tương đương đối tượng mục tiêu) tự thao tác trực tiếp trên **Figma Interactive Prototype**, quan sát hành vi thực tế và điền kết quả thật vào bảng dưới đây trước khi đưa lên GitHub Wiki và Behance.

### 2.1. Kịch bản kiểm thử & Bộ tác vụ đại diện (Representative Tasks)

- **Công cụ sử dụng:** Figma Interactive Prototype (`https://www.figma.com/proto/fGXYmJMlxPStGfv1ouUuDe/Figma-HitDad--Copy-?node-id=1-273&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1%3A274`).
- **Quy tắc thực hiện:** Người điều phối chỉ đọc bối cảnh tình huống, **không gợi ý nút cần bấm**, quan sát thao tác tự nhiên, ghi nhận thời gian hoàn thành, điểm bị khựng/nhầm lẫn và hỏi lý do sau khi kết thúc tác vụ. Tôn trọng quyền riêng tư bằng cách ẩn danh (`P01`, `P02`, `P03`).

| Mã Task | Bối cảnh & Yêu cầu giao cho người test | Starting Point trên Figma | Điều kiện hoàn thành (Success Criteria) | Điểm cần quan sát |
| :--- | :--- | :--- | :--- | :--- |
| **UT-01** | *"CLB vừa mở kèo đá tối thứ Tư 04/11. Hãy xem thông tin sân, kiểm tra giờ nào đang nhiều người chọn nhất và xác nhận tham gia (hoặc báo không đi được kèm lý do)."* | `Flow 2: Lịch đá & Vote kèo` (`01 Lịch đá`) | Mở được `02 Chi tiết trận`, đọc được số phiếu từng khung giờ, bấm được `Tham gia` hoặc hoàn thành overlay chọn lý do. | Có tìm ra nút vào chi tiết trận và thanh tiến độ phiếu vote không? Có thấy chip chọn lý do nhanh không? |
| **UT-02** | *"Đã có đội hình chính thức và tới giờ đá tại Sân Mười Thọ. Hãy kiểm tra bạn đá ở Team nào, ai là thủ môn đội bạn, rồi thực hiện Check-in tại sân. Nếu lỡ bấm nhầm hoặc mạng yếu thì xử lý thế nào?"* | `Flow 3: Chia đội & Check-in tại sân` (`02f-1` → `02f-2`) | Đọc đúng tên đội (`Team 3`) và thủ môn (`Nguyễn Lê Ngọc Lân`), bấm chuyển sang mở Check-in, bấm `Check-in tại sân` sang `02f-3`, biết cách bấm `Hoàn tác` hoặc `Thử lại ngay` ở màn lỗi `02f-err`. | Có nhận ra trạng thái nút `Chưa mở` vs `Đang mở` không? Có dễ thấy liên kết `Hoàn tác` và nút `Thử lại ngay` không? |
| **UT-03** | *"Sau khi đội đã chia xong thì bạn đột xuất có việc bận không ra sân được. Hãy gửi yêu cầu xin nghỉ cho admin."* | `02f-2` | Bấm nút `Xin nghỉ`, hiểu cảnh báo vẫn tính tiền trước khi admin duyệt, chọn lý do và bấm gửi yêu cầu. | Có phân biệt được `Không tham gia` (trước khi chốt) và `Xin nghỉ` (sau khi chia đội) không? |
| **UT-04** | *"Trận 28/10 đã đá xong. Hãy kiểm tra phần tiền bạn phải đóng được tính như thế nào và thực hiện chuyển khoản qua VietQR."* | `Flow 4: Chốt bill & VietQR` (`03 Thanh toán` hoặc `02g`) | Đọc đúng công thức (`900k + 150k ÷ 21 = 50.000đ`), tìm thấy nút copy nội dung chuyển khoản `HITDAD 2810 THANG` và trạng thái chờ xác nhận. | Có tin tưởng cách chia tiền không? Có thắc mắc gì về nút `Mở app ngân hàng` không? |

### 2.2. Bảng ghi nhận kết quả kiểm thử (Điền dữ liệu thật sau khi test ≥ 3 người ngoài nhóm)

| Mã người test (Ẩn danh) | Hồ sơ đối tượng (Vai trò / Thói quen đá bóng) | Ngày test & Thiết bị | UT-01 (Vote/Báo vắng) | UT-02 (Xem đội & Check-in) | UT-03 (Xin nghỉ) | UT-04 (VietQR & Bill) | Vấn đề Usability / Điểm bị khựng quan sát được |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P01** | `Sinh viên IU năm cuối, thành viên của clb` | `20/11/2026 / Figma prototype` | `Hoàn thành` | `Khựng` | `Hoàn thành` | `Hoàn thành` | `người dùng thắc mắc là trên giao diện đang không thấy cho phép họ tự check-in tại sân` |
| **P02** | `Sinh viên CSE năm 2` | `20/11/2026 / Figma prototype` | `Hoàn thành` | `Khựng` | `Hoàn thành` | `Hoàn thành` | `Đưa ra nhận xét về việc user không được quyền tự check-in và chưa thấy xử lý những trường hợp gặp sự cố ở UI ví dụ như lỗi mạng` |
| **P03** | `Từng đứng ra thanh toán tiền sân cho clb` | `21/11/2026 / Figma prototype` | `Hoàn thành` | `Hoàn thành` | `Hoàn thành` | `Hoàn thành` | `User đánh giá cao về tính tiện lợi của app vì đã giải quyết được vấn đề đau đầu là phải nhớ và đòi tiền sân của từng người` |

### 2.3. Các cải tiến thiết kế đã thực hiện (Design Improvements & Iterations)

#### A. Các cải tiến đã hoàn thiện trên Figma (Heuristic & Prototype Walkthrough)
1. **Iteration 1 — Mở khóa luồng Check-in đầy đủ & cơ chế Hoàn tác (`02f-1` → `02f-2` → `02f-3`):**
   - *Vấn đề phát hiện (Before):* Ban đầu toàn bộ màn hình chi tiết trận sau khi chia đội chỉ hiển thị thanh đáy bị vô hiệu hóa (*"Mở check-in lúc 18:00"*), khiến người dùng không thể thực hiện thao tác điểm danh thực tế và lo ngại bấm nhầm sẽ bị tính tiền oan.
   - *Cải tiến (After):* Tách rõ 2 màn hình tiếp nối `02f-2 Đang mở Check-in` (nút chính `#1546C8` nổi bật ở vùng ngón cái) và `02f-3 Đã Check-in tại sân` kèm timestamp `18:22` và đường dẫn `Check-in nhầm? Hoàn tác` nối quay lại `02f-2`.
2. **Iteration 2 — Phục hồi lỗi mạng ngoài sân bóng & Xác thực đăng nhập (`02f-err`, `00a-err`):**
   - *Vấn đề phát hiện (Before):* Luồng thiết kế ban đầu chỉ có kịch bản thành công (Happy Path), bỏ trống tình huống rớt mạng 4G ở sân cỏ nhân tạo hoặc nhập sai mật khẩu.
   - *Cải tiến (After):* Bổ sung màn hình `02f-err` với thẻ cảnh báo nổi bật *"Mất kết nối mạng tại sân bóng — Dữ liệu đã lưu tạm"* kèm nút `Thử lại ngay` nối tiếp về `02f-3`; bổ sung `00a-err` hiển thị viền đỏ trực tiếp tại ô mật khẩu và số lần thử còn lại.
3. **Iteration 3 — Đồng bộ trạng thái trống (Empty State) khi đọc hết thông báo (`09b`):**
   - *Vấn đề phát hiện (Before):* Màn hình thông báo chỉ có danh sách đầy tin nhắn, chưa có trạng thái trống khi bấm `Đọc hết` và chip đếm chưa đồng bộ về `0`.
   - *Cải tiến (After):* Bổ sung màn hình `09b Thông báo – Trạng thái trống` hiển thị đồng bộ `0 chưa đọc`, chip `Chưa đọc 0` và thẻ Empty State giải thích rõ các thông báo sẽ xuất hiện tại đây.

#### B. Cải tiến bổ sung sau khi chạy Usability Testing với P01–P03
> *(Sau khi test thực tế với 3 người ngoài nhóm ở mục 2.2, nhóm chọn ít nhất 1 lỗi usability rõ ràng nhất mà người test gặp phải, chỉnh sửa lại trên Figma, chụp ảnh **Before → After** và điền tóm tắt vào mục này + đưa lên Behance Case Study).*
- **Vấn đề phát hiện từ P01–P03:** `Vấn đề phát hiện từ P01–P02: Khi chạy UT-02, cả P01 và P02 đều bị khựng vì thanh đáy ở màn chi tiết trận sau chia đội chỉ thấy trạng thái bị khóa (chưa cho thành viên tự check-in tại sân), và P02 góp ý chưa thấy giao diện xử lý khi gặp sự cố mạng tại sân.`
- **Thay đổi trên Figma (Before → After):** `Thay đổi trên Figma (Before → After): Bổ sung màn 02f-2 Đang mở Check-in (nút xanh Check-in tại sân), 02f-3 Đã Check-in (có nút Hoàn tác), màn hình 02f-err Lỗi mạng tại sân (nút Thử lại ngay) và nối dây tương tác Prototype cho cả luồng này.`
- **Kết quả sau chỉnh sửa (nếu test lại):** `Sau khi đã bổ sung thì P01 và P02 đều đánh giá là đúng mong đợi của họ`

---

## Phần 3 · Khai báo sử dụng Generative AI (Bắt buộc theo Mục 6)

> Copy nguyên mục này dán thành một mục riêng (ví dụ **Generative AI Usage Disclosure**) trên trang chủ hoặc trang tổng kết Assignment 2 của **GitHub Wiki**.

### Tuyên bố sử dụng công cụ AI tạo sinh (Generative AI Disclosure)
Trong quá trình thực hiện **Assignment 2 — Product Design, Prototyping, and Validation** cho dự án **CSE HitDad**, nhóm **Hiền và nhiều tài** sử dụng công cụ AI tạo sinh làm trợ lý hỗ trợ theo đúng quy định liêm chính học thuật của học phần:

- **Các tác giả chính của bài tập lớn:** Toàn bộ ý tưởng sản phẩm, cấu trúc nghiệp vụ bóng đá câu lạc bộ (*Vote giờ → Chia đội Tier/Thủ môn → Check-in → VietQR*), dữ liệu thực tế của CLB CSE FC HCMUT, thiết kế giao diện Figma cốt lõi, nội dung tiếng Việt và kiểm thử người dùng đều do 5 thành viên trong nhóm trực tiếp xây dựng, quyết định và chịu trách nhiệm.
- **Phạm vi sử dụng công cụ AI hỗ trợ:**
  1. **Rà soát bám sát Rubric & Kiểm tra thiếu sót:** Đối chiếu file thiết kế Figma với các tiêu chí của đề Assignment 2 để phát hiện các trạng thái tương tác còn thiếu (*Error/Validation, Offline Recovery, Empty State, Prototype Starting Points*).
  2. **Hỗ trợ kỹ thuật trên Figma & Web:** Hỗ trợ viết script plugin nội bộ (`HitDad BTL2 Finisher`) để tự động tạo khung tổng hợp Design System, dựng các màn hình biến thể trạng thái từ component gốc của nhóm và nối dây tương tác Prototype; hỗ trợ dựng khung mã nguồn HTML/CSS cho **Product Landing Page** đồng bộ với bộ token màu sắc/chữ của Figma.
  3. **Biên tập cấu trúc tài liệu:** Hỗ trợ gợi ý dàn ý kịch bản kiểm thử Usability Testing, khung nội dung Case Study trên Behance và kiểm tra tính nhất quán giữa Wiki với thiết kế.
- **Quy trình kiểm duyệt của nhóm:** Tất cả đầu ra từ công cụ AI đều được thành viên nhóm rà soát thủ công trực tiếp trên trình soạn thảo Figma, trình duyệt web và kiểm thử lại các luồng tương tác trước khi xuất bản. Mọi thành viên trong nhóm đều nắm rõ lý do đằng sau từng quyết định thiết kế và có thể trình bày trực tiếp khi bảo vệ bài tập lớn.
