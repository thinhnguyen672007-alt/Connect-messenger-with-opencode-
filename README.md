# Messenger → OpenCode

Dự án học backend: nhận yêu cầu qua Messenger, giao việc cho OpenCode và gửi kết quả về người dùng.

## Chạy trong môi trường phát triển

```bash
npm ci
npm run dev
```

Mở `http://127.0.0.1:3000/health`. Kết quả mong đợi là `{"status":"ok"}`.

## Kiểm tra kiểu dữ liệu

```bash
npm run typecheck
```

Lệnh này kiểm tra các file TypeScript trong `src`, không chạy server và không tạo file JavaScript.
`npm run dev` dùng `tsx` để chạy và khởi động lại khi lưu code; nó không thay thế bước kiểm tra kiểu.

## Cấu hình hiện tại

- `package.json`: `type: module` sử dụng hệ module ESM (`import`/`export`).
- `tsconfig.json`: bật `strict` và cách phân giải module phù hợp Node.js.
- `skipLibCheck`: bỏ qua kiểm tra bên trong file khai báo kiểu của thư viện; kiểu của thư viện vẫn được dùng khi kiểm tra code của dự án.

## Kiểm tra và định dạng code

```bash
npm run lint
npm run format:check
npm run check
```

- `lint`: phát hiện vấn đề như biến không dùng và khai báo `any`.
- `format:check`: kiểm tra định dạng, không sửa file.
- `check`: chạy lần lượt kiểm tra kiểu, lint và định dạng; dừng khi có lỗi.
- `npm run format`: tự sửa định dạng file. Xem diff sau khi chạy.

ESLint kiểm tra quy tắc code; Prettier định dạng code. Các lệnh này chưa thay thế test nghiệp vụ.
Test tự động và build sẽ được bổ sung ở những bước tiếp theo.
