# Messenger → OpenCode

Dự án học Backend Engineering bằng Node.js và TypeScript: nhận yêu cầu qua Messenger, giao việc cho OpenCode, rồi gửi kết quả về người dùng.

Mã nguồn và cấu hình cũ đã được gỡ để xây lại từ đầu. Đích kiến trúc: Messenger webhook → Node.js API → Redis/BullMQ → worker → OpenCode → Messenger Send API. PostgreSQL lưu hội thoại và lịch sử xử lý.

Mỗi bước sẽ được giải thích và kiểm tra trước khi chuyển sang bước tiếp theo.

In this project, I will learn from the fundemental of backend and system, the way to improve the effecientcy, manage api,..
