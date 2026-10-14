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

## Cấu trúc source

- `src/app.ts`: tạo ứng dụng, log, giới hạn body và xử lý lỗi.
- `src/server.ts`: đọc cấu hình, mở cổng và xử lý tín hiệu dừng.
- `src/config.ts`: kiểm tra `HOST` và `PORT` trước khi mở cổng.
- `src/routes/health.ts`: endpoint kiểm tra HTTP.
- `src/app.test.ts`: kiểm tra HTTP bằng `inject`, không cần mở cổng mạng.

## Cấu hình môi trường

Node.js hiện tại đọc `.env` bằng `--env-file-if-exists`; không cần cài dotenv.
Có thể sao chép `.env.example` thành `.env` và đổi `PORT`.
Giữ `HOST=127.0.0.1` khi học trên máy; cấu hình công khai sẽ được giải thích khi deploy.

## Test và bản chạy JavaScript

```bash
npm test
npm run build
npm start
```

`build` tạo JavaScript trong `dist` và không đưa file test vào đó. Chạy build trước start.
`npm run check` hiện kiểm tra kiểu, lint, định dạng, test và build.

Body được giới hạn 1 MiB. Lỗi nội bộ trả thông báo chung, chi tiết được ghi vào log.
Khi nhận SIGINT/SIGTERM, server chờ đóng kết nối tối đa 10 giây trước khi buộc dừng.
Các mức này là cấu hình ban đầu, chưa phải số liệu benchmark.
