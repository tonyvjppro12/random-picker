# 🎲 HƯỚNG DẪN SỬ DỤNG ONLINE-DICE (KHÔNG CẦN BẬT SERVER)

Phiên bản này đã được nâng cấp lên **Serverless Cloud Sync**:
- **KHÔNG CẦN** mở Command Prompt (cmd) hay PowerShell.
- **KHÔNG CẦN** chạy file `python server.py`.
- **KHÔNG CẦN** mở máy tính trước hay dùng ngrok / localtunnel.
- **KHÁC MẠNG VẪN CHẠY VÔ TƯ**: Máy livestream ở nhà cắm mạng dây, điện thoại bật 4G/5G ở bất kỳ đâu đều kết nối và điều khiển xúc xắc tức thì (độ trễ < 80ms).

---

## 🚀 2 CÁCH DÙNG

### CÁCH 1: Dùng trực tiếp trên máy tính & điện thoại (Dễ nhất)

1. **Trên máy tính livestream**:
   - Nhấp đúp chuột mở file `index.html` bằng trình duyệt (Chrome, Edge, Cốc Cốc,...).
   - Trang xúc xắc hiện lên bình thường, góc dưới có kết nối Cloud tự động.

2. **Mở Admin Panel bí mật trên máy tính (nếu muốn chỉnh)**:
   - Nhấn **`Ctrl + Shift + F12`** hoặc **click 5 lần vào logo ONLINE-DICE.COM**.
   - Nhập PIN: **`8888`**

3. **Trên điện thoại (Remote điều khiển từ xa)**:
   - Gửi file `remote.html` sang điện thoại và mở lên, hoặc đưa lên web (xem Cách 2).
   - Nhập PIN: **`8888`** để mở bảng điều khiển.
   - Nhấn nút **🎲 ROLL TRÊN MÁY TÍNH !** hoặc chạm đổi màu bất kỳ -> Trên màn hình livestream đổi ngay lập tức!

---

### CÁCH 2: Đưa lên Web miễn phí vĩnh viễn (Khuyên dùng để có link trên điện thoại)

Bạn chỉ cần kéo thả cả thư mục này lên dịch vụ hosting tĩnh miễn phí:

1. Vào trang: **[https://app.netlify.com/drop](https://app.netlify.com/drop)** (Không cần code, hoàn toàn miễn phí).
2. Kéo cả thư mục `online-dice` thả vào ô upload.
3. Trong 5 giây bạn sẽ nhận được một đường link web, ví dụ: `https://ten-ban-chon.netlify.app`.

Khi đó:
- **Link cho khán giả / màn hình livestream**: `https://ten-ban-chon.netlify.app`
- **Link remote cho bạn cầm điện thoại**: `https://ten-ban-chon.netlify.app/remote.html` (Nhập PIN 8888 để điều khiển)

---

## 🔒 BẢO MẬT PHÒNG RIÊNG (ROOM ID)

- Mặc định mã phòng bí mật là: **`dice8888`**
- Nếu bạn muốn đổi sang mã phòng riêng (ví dụ `myroom123`):
  - Trong Owner Panel mục 6 trên `index.html`, đổi sang `myroom123`.
  - Trên `remote.html`, đổi sang cùng mã `myroom123` là kết nối riêng tư 1-1, không ai can thiệp được.

---

## 🎨 DANH SÁCH TÍNH NĂNG
1. **🖌️ Giao diện đổi màu 1-chạm siêu tốc cho điện thoại (MỚI)**:
   - **Không mở popup, không bật bàn phím ảo**: Tất cả là nút tròn to bấm cực nhạy bằng 1 ngón tay.
   - **Bộ màu mẫu 1-chạm**: Casino (Mặt 1 Đỏ, 2-6 Đen), Cầu vồng, Toàn Đỏ, Toàn Đen, Toàn Xanh, Toàn Trắng.
   - **Bảng 16 màu phổ biến 1 chạm**: Bấm mặt cần đổi -> bấm màu là xong ngay trong 0.1s.
   - **Tính năng tự nhảy mặt (Auto-advance)**: Chọn Mặt 1 xong tự nhảy sang Mặt 2, 3, 4, 5, 6 — đổi cả bộ xúc xắc chỉ mất 2 giây!
   - **Nút "Đổi cả 6 mặt cùng lúc"**: 1 chạm đổi toàn bộ xúc xắc sang cùng một màu.
2. **⚡ Tùy chỉnh tốc độ lăn xúc xắc trên điện thoại**:
   - 6 nút chọn nhanh: Cực nhanh (0.4s), Nhanh (0.7s), Chuẩn (1.0s), Chậm (1.8s), Hồi hộp (2.6s), Rất chậm (3.5s).
   - Thanh trượt tùy chỉnh chi tiết từ 0.3s đến 3.5s.
   - Hiệu ứng nảy đa va chạm và tiếng xúc xắc tự co dãn theo thời gian thực (lăn chậm thì va chạm nảy nhiều lần, giảm tốc dần hồi hộp).
3. **15 Theme bàn đổ**: Blue, Sab-Blue, Green, Sab-Green, Red, Sab-Red, Pink, B&W, Sab-Black, Heaven, Hell, Underwater, Bronze, Silver, Gold.
4. **Âm thanh tiếng xúc xắc thật**: Giả lập đa va chạm (bounces), cộng hưởng vang mặt bàn (convolver reverb), tiếng thud khi xúc xắc dừng.
5. **Mục số 5 - Custom Face Colors**: Đổi mã màu Hex cho từng mặt từ 1 đến 6.
6. **Chế độ 6-sided Dice & Color Dice**.
7. **Nút Admin ẩn 100%**: Người xem livestream không bao giờ thấy nút Admin.
