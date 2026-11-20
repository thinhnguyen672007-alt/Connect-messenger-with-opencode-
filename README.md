
# Messenger → OpenCode

Dự án học backend: kết nối Messenger với OpenCode để nhắn yêu cầu qua chat, backend xử lý và trả kết quả về Messenger.

## Mục tiêu

- Hiểu cách một hệ thống backend thực tế nhận sự kiện, xử lý tác vụ và gọi dịch vụ bên ngoài.
- Xây hệ thống từ đơn giản đến đầy đủ (Architecture C): API, queue, worker, database, AI agent.

## Kiến trúc tổng quan

`Messenger/Page -> Meta Webhook -> Node.js API (Express, TS) -> Redis/BullMQ -> Worker -> OpenCode -> PostgreSQL -> Messenger Send API -> User`

## Đề xuất luồng xử lý

1. Người dùng nhắn tin cho Page; Meta gửi sự kiện về webhook POST /webhook.
2. API kiểm tra chữ ký HMAC và verify token, lưu tin nhắn vào PostgreSQL rồi trả 200 ngay để Meta không gửi lại.
3. API đẩy một job vào hàng đợi BullMQ (Redis), dùng messageId làm khóa idempotency để tránh xử lý trùng.
4. Worker lấy job, mở hoặc tái sử dụng session OpenCode theo conversationId rồi gửi nội dung tin nhắn cho agent.
5. Agent xử lý xong, worker lưu kết quả vào PostgreSQL và gọi Messenger Send API trả lời người dùng.
6. Gặp lỗi tạm thời (mạng, OpenCode bận), job tự retry theo backoff; quá số lần thì ghi log và báo lỗi về chat.
Nguyên tắc: webhook chỉ nhận và xếp hàng, mọi xử lý nặng nằm ở worker để API luôn phản hồi nhanh.

## Công nghệ chính

- Node.js, TypeScript, Express
- Meta Messenger Platform / Graph API, Webhook
- Redis, BullMQ
- PostgreSQL
- OpenCode (server/SDK)

## Trạng thái

Đang xây dựng từ đầu, từng bước nhỏ và kiểm tra được.
Sau khi làm xong sẽ học được gì

- Backend & API: HTTP, REST, cách thiết kế endpoint, request/response, middleware, cấu trúc project Node.js/TypeScript.
- Webhook & tích hợp Meta: khác biệt webhook vs API, verify webhook (token/HMAC/raw body), token/permission cơ bản, luồng nhận và gửi tin Messenger.
- Xử lý bất đồng bộ: vì sao tác vụ AI lâu cần queue, cách dùng Redis + BullMQ, worker, retry, timeout, idempotency ở mức cơ bản.
- Database: thiết kế bảng với PostgreSQL (conversation/message/session/log), khóa chính/ngoại, index, lưu và truy vết dữ liệu.
- AI Agent (OpenCode): agent khác chatbot/LLM, session, tool/permission, cách giới hạn quyền và rủi ro khi agent chạy lệnh/sửa file.
- Bảo mật & vận hành: quản lý secret/env, kiểm tra đầu vào, logging/trace lỗi, tư duy tách API và worker; triển khai cơ bản (Docker/tunnel/VPS) nếu đi tới cuối.
- Tư duy hệ thống: phân tích trade-off, chọn giải pháp đủ dùng, debug theo luồng end-to-end và giải thích kiến trúc như một backend engineer.
