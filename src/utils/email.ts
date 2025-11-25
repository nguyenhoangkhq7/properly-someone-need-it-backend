import axios from "axios";
import https from "https"; // Thêm thư viện https có sẵn của Node

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Cấu hình Agent để khắc phục lỗi ECONNRESET trên Node mới
const agent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false, // Bỏ qua lỗi SSL (giúp vượt qua Antivirus/Firewall local)
  family: 4, // Ép buộc dùng IPv4 (Tránh lỗi IPv6 chập chờn)
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailOptions) => {
  if (!RESEND_API_KEY) {
    console.error("❌ Thiếu RESEND_API_KEY");
    return null;
  }

  console.log(`📨 Đang gửi mail tới: [${to}]...`);

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "onboarding@resend.dev",
        to: to,
        subject: subject,
        text: text,
        html: html || text,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        httpsAgent: agent, // <--- THÊM DÒNG NÀY (Chìa khóa sửa lỗi)
        timeout: 20000, // Tăng timeout lên 20s
      }
    );

    console.log("✅ Gửi mail thành công! ID:", response.data.id);
    return response.data;
  } catch (error: any) {
    // Log lỗi nhưng không chặn luồng chạy của App
    if (error.response) {
      console.error("❌ Lỗi từ Resend:", error.response.data);
    } else {
      console.error("❌ Lỗi mạng Local:", error.message);
    }
    return null;
  }
};

// ... Phần hàm sendOtpEmail giữ nguyên ...
export const sendOtpEmail = async (
  to: string,
  otpCode: string,
  purpose: string
) => {
  // Copy lại nội dung hàm sendOtpEmail cũ của bạn vào đây
  const typeText = purpose === "register" ? "đăng ký" : "đăng nhập";
  const subject = `Mã xác thực ${typeText} - psni`;
  const html = `<h1>OTP của bạn là: ${otpCode}</h1>`; // Viết gọn để test cho nhanh
  await sendEmail({ to, subject, text: otpCode, html });
};
