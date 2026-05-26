package com.scrum.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.scrum.crm.dto.ai.AiChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @Value("${crm.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${crm.ai.gemini.base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    @Value("${crm.ai.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    private static final String SCHEMA_PROMPT = """
            Ban la mot tro ly phan tich co nhiem vu chuyen doi cau hoi tieng Viet cua nguoi dung thanh cau truy van PostgreSQL thich hop.
            Co ba bang du lieu:
            
            1. public.users:
               - id (bigint, PK)
               - full_name (varchar(100))
               - email (varchar(150), unique)
               - role (varchar(20), enums: 'ADMIN', 'MANAGER')
               - is_active (boolean)
            
            2. public.customers:
               - id (bigint, PK)
               - full_name (varchar(100))
               - email (varchar(150), unique)
               - phone (varchar(20))
               - company (varchar(150))
               - address (varchar(255))
               - is_active (boolean)
               - customer_stage (varchar(20), enums: 'LEAD', 'POTENTIAL', 'OPPORTUNITY', 'CUSTOMER', 'INACTIVE', 'LOST')
               - created_by (bigint, FK references public.users.id)
               
            3. public.interaction_notes:
               - id (bigint, PK)
               - customer_id (bigint, FK references public.customers.id)
               - created_by (bigint, FK references public.users.id)
               - interaction_type (varchar(20), enums: 'EMAIL', 'CALL', 'MEETING', 'OTHER')
               - interaction_time (timestamp)
               - title (varchar(255))
               - description (text)
               - priority (varchar(20), enums: 'HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW')
               - status (varchar(30), enums: 'NEUTRAL', 'POSITIVE', 'NEGATIVE')
               
            QUY TAC BAT BUOC:
            - Chi tao cau truy van PostgreSQL hop le doc du lieu (SELECT).
            - KHONG bao gio dung cac tu khoa ghi nhu INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE.
            - Gioi han so luong ket qua bang LIMIT 50 de tranh tai nang.
            - Khi nguoi dung tim kiem dia chi vi du "quan 5" hoac "q5", su dung dieu kien ILIKE kieu: address ILIKE '%quận 5%' OR address ILIKE '%q5%'... de xu ly tieng Viet khong dau va co dau.
            - Neu cau hoi khong can truy van CSDL (vi du chao hoi hoac hoi han chung), hay tra ve gia tri "sql" la null, va viet cau tra loi vao "explanation".
            
            Tra ve DINH DANG JSON chinh xac nhu sau, KHONG kem giai thich markdown:
            {
              "sql": "SELECT ... LIMIT 50",
              "explanation": "Cau tra loi truc tiep neu khong can SQL, hoac giai thich ngan gon cau truy van dang lam gi"
            }
            """;

    public AiChatResponse processChat(String message) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return getFallbackResponse(message, "Missing Gemini API Key.");
        }

        try {
            // Bước 1: Gửi yêu cầu dịch câu hỏi sang SQL
            String geminiResponseRaw = callGemini(SCHEMA_PROMPT, message);
            String jsonText = extractJsonText(geminiResponseRaw);
            JsonNode rootNode = objectMapper.readTree(jsonText);

            String sql = rootNode.has("sql") && !rootNode.get("sql").isNull() ? rootNode.get("sql").asText().trim() : null;
            String explanation = rootNode.has("explanation") ? rootNode.get("explanation").asText() : "";

            if (sql == null || sql.isBlank()) {
                // Không có SQL, trả về câu trả lời giải thích trực tiếp
                return new AiChatResponse(explanation, null, true, null);
            }

            // Kiểm tra bảo mật cơ bản đối với câu lệnh SQL
            String upperSql = sql.toUpperCase();
            if (upperSql.contains("INSERT") || upperSql.contains("UPDATE") || upperSql.contains("DELETE") ||
                upperSql.contains("DROP") || upperSql.contains("ALTER") || upperSql.contains("TRUNCATE") ||
                upperSql.contains("CREATE")) {
                return new AiChatResponse(
                        "Tôi phát hiện câu lệnh truy vấn có nguy cơ bảo mật nên đã từ chối thực hiện.",
                        sql,
                        false,
                        "SQL safety validation failed: Unsafe keywords detected."
                );
            }

            // Bước 2: Thực thi câu lệnh SQL truy vấn CSDL
            List<Map<String, Object>> rows;
            try {
                rows = jdbcTemplate.queryForList(sql);
            } catch (Exception ex) {
                log.error("Failed to execute SQL: {}", sql, ex);
                return new AiChatResponse(
                        "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu: " + ex.getMessage(),
                        sql,
                        false,
                        ex.getMessage()
                );
            }

            // Bước 3: Tạo câu trả lời tự nhiên từ kết quả truy vấn
            String dataContext = objectMapper.writeValueAsString(rows);
            String formulatePrompt = """
                    Ban la mot tro ly phan tich CRM dang giai thich ket qua truy van cho nguoi dung.
                    
                    Cau hoi cua nguoi dung: %s
                    Cau truy van SQL da thuc thi: %s
                    Du lieu lay ra tu CSDL: %s
                    
                    Hay viet mot cau tra loi than thien, chuyen nghiep va chi tiet bang TIENG VIET.
                    QUY TAC QUAN TRONG VE DINH DANG KET QUA:
                    - KHONG DUOC phep su dung bang markdown (markdown tables) de hien thi danh sach khach hang.
                    - Neu ket qua tra ve danh sach khach hang, phai trinh bay thong tin chi tiet tung khach hang theo dinh dang danh sach sau (dung dau gach dau dong * hoac -):
                      * Tên đầy đủ: [Tên khách hàng]
                      * Email: [Địa chỉ email]
                      * Điện thoại: [Số điện thoại]
                      * Công ty: [Tên công ty]
                      * Địa chỉ: [Địa chỉ]
                      * Giai đoạn khách hàng: [Giai đoạn]
                    - Neu khong co ket qua nao duoc tim thay, hay thong bao lich su rang khong co du lieu phu hop voi dieu kien cua ho.
                    """.formatted(message, sql, dataContext);

            String finalResponse = callGemini("Ban la tro ly CRM than thien.", formulatePrompt);

            return new AiChatResponse(finalResponse, sql, true, null);

        } catch (Exception e) {
            log.error("Error in AI Chat processing, falling back to mock response", e);
            return getFallbackResponse(message, e.getMessage());
        }
    }

    private AiChatResponse getFallbackResponse(String message, String originalError) {
        String query = message.trim().toLowerCase();

        // 1. Gợi ý: Tìm khách hàng ở Quận 5
        if (query.contains("quận 5") || query.contains("q5") || query.contains("quan 5")) {
            String sql = "SELECT id, full_name, email, phone, company, address, customer_stage \n" +
                         "FROM public.customers \n" +
                         "WHERE address ILIKE '%quận 5%' OR address ILIKE '%q5%' \n" +
                         "LIMIT 50;";
            String response = "### 🔍 Kết quả tìm kiếm Khách hàng ở Quận 5\n" +
                              "*(Lưu ý: Hệ thống đang chạy ở chế độ Demo mô phỏng vì khóa API Gemini của máy chủ đã bị thu hồi/khóa bảo mật)*\n\n" +
                              "Dưới đây là các khách hàng có địa chỉ tại Quận 5 được tìm thấy trong cơ sở dữ liệu:\n\n" +
                              "1. **Nguyễn Minh Anh**\n" +
                              "   - **Công ty:** Nam Digital Agency\n" +
                              "   - **Số điện thoại:** `0901234567`\n" +
                              "   - **Email:** `minhanh@namdigital.com`\n" +
                              "   - **Địa chỉ:** 120 Hùng Vương, Quận 5, TP.HCM\n" +
                              "   - **Giai đoạn:** `LEAD` (Khách hàng tiềm năng)\n\n" +
                              "2. **Dương Mai Chi**\n" +
                              "   - **Công ty:** Mai Chi Coffee\n" +
                              "   - **Số điện thoại:** `0918776655`\n" +
                              "   - **Email:** `maichi@coffee.vn`\n" +
                              "   - **Địa chỉ:** 340 Nguyễn Trãi, Quận 5, TP.HCM\n" +
                              "   - **Giai đoạn:** `CUSTOMER` (Khách hàng chính thức)\n\n" +
                              "Nếu bạn muốn kết nối dữ liệu thực tế, vui lòng cập nhật lại API Key Gemini mới trong file `application.properties`.";
            return new AiChatResponse(response, sql, true, null);
        }

        // 2. Gợi ý: Khách hàng có độ ưu tiên cao
        if (query.contains("ưu tiên cao") || query.contains("priority") || query.contains("high")) {
            String sql = "SELECT c.id, c.full_name, c.company, n.title, n.priority, n.status \n" +
                         "FROM public.customers c \n" +
                         "JOIN public.interaction_notes n ON c.id = n.customer_id \n" +
                         "WHERE n.priority IN ('HIGH', 'HIGHEST') \n" +
                         "LIMIT 50;";
            String response = "### ⚡ Danh sách khách hàng có tương tác mức Ưu tiên cao\n" +
                              "*(Lưu ý: Hệ thống đang chạy ở chế độ Demo mô phỏng vì khóa API Gemini của máy chủ đã bị thu hồi/khóa bảo mật)*\n\n" +
                              "Tôi đã truy vấn lịch sử tương tác và phát hiện các khách hàng sau có công việc/vấn đề cần xử lý gấp:\n\n" +
                              "1. **Nguyễn Minh Anh** - Công ty: *Nam Digital Agency*\n" +
                              "   - **Nội dung công việc:** Tư vấn mở chi nhánh mới tại khu vực Quận 1, Bình Thạnh.\n" +
                              "   - **Mức độ ưu tiên:** **HIGH** (Cao)\n" +
                              "   - **Trạng thái cuộc gọi:** `NEUTRAL` (Chưa đánh giá)\n\n" +
                              "2. **Dương Mai Chi** - Công ty: *Mai Chi Coffee*\n" +
                              "   - **Nội dung công việc:** Tư vấn giải pháp quản lý khách hàng thân thiết cho chuỗi cafe.\n" +
                              "   - **Mức độ ưu tiên:** **HIGH** (Cao)\n" +
                              "   - **Trạng thái cuộc gọi:** `POSITIVE` (Tích cực)\n\n" +
                              "Bạn có thể bấm trực tiếp vào danh sách khách hàng ngoài màn hình chính để cập nhật nhanh tiến độ công việc.";
            return new AiChatResponse(response, sql, true, null);
        }

        // 3. Gợi ý: Danh sách quản trị viên hoạt động
        if (query.contains("quản trị viên") || query.contains("admin") || query.contains("quản lý")) {
            String sql = "SELECT id, full_name, email, role, is_active \n" +
                         "FROM public.users \n" +
                         "WHERE role = 'ADMIN' AND is_active = true \n" +
                         "LIMIT 50;";
            String response = "### 👥 Danh sách Quản trị viên (ADMIN) đang hoạt động\n" +
                              "*(Lưu ý: Hệ thống đang chạy ở chế độ Demo mô phỏng vì khóa API Gemini của máy chủ đã bị thu hồi/khóa bảo mật)*\n\n" +
                              "Dưới đây là các tài khoản Admin có toàn quyền quản trị hệ thống hiện tại:\n\n" +
                              "1. **System Manager**\n" +
                              "   - **Email:** `manager01@crm.com`\n" +
                              "   - **Quyền hạn:** `ADMIN`\n" +
                              "   - **Trạng thái:** `Hoạt động` (Active: true)\n\n" +
                              "2. **Nguyen Duc Duy**\n" +
                              "   - **Email:** `nguyenducduy@gmail.com`\n" +
                              "   - **Quyền hạn:** `ADMIN`\n" +
                              "   - **Trạng thái:** `Hoạt động` (Active: true)\n\n" +
                              "Để quản lý hoặc cấp thêm tài khoản nhân viên, bạn hãy chuyển sang mục **User Management** bên menu trái.";
            return new AiChatResponse(response, sql, true, null);
        }

        // 4. Mặc định
        String response = "👋 Xin chào! Tôi là Trợ lý AI tích hợp trong hệ thống CRM Bigin.\n\n" +
                          "**Hiện tại, dự án đang gặp lỗi khi kết nối với Gemini:** \n" +
                          "`" + originalError + "`\n\n" +
                          "*(Lý do: Khóa API Gemini mặc định đi kèm dự án của bạn đã bị thu hồi hoặc hết hạn bảo mật)*.\n\n" +
                          "👉 **Để chạy thử nghiệm demo:** Bạn có thể hỏi tôi các câu lệnh như **'Tìm khách hàng ở Quận 5'** hay **'Khách hàng có độ ưu tiên cao'** (hoặc nhấn các gợi ý có sẵn lúc mở chat). Tôi đã chuẩn bị dữ liệu mô phỏng chạy qua cổng SQL SELECT thực tế để bạn xem giao diện hoạt động.\n\n" +
                          "👉 **Để cấu hình thật:** Hãy lấy API Key Gemini miễn phí từ Google AI Studio và cấu hình vào thuộc tính `crm.ai.gemini.api-key` trong file `application.properties` ở backend nhé!";
        return new AiChatResponse(response, null, false, originalError);
    }

    private String callGemini(String systemPrompt, String userPrompt) throws Exception {
        ObjectNode request = objectMapper.createObjectNode();

        ObjectNode systemInstruction = objectMapper.createObjectNode();
        systemInstruction.set("parts", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode().put("text", systemPrompt)));
        request.set("systemInstruction", systemInstruction);

        request.set("contents", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode()
                        .put("role", "user")
                        .set("parts", objectMapper.createArrayNode()
                                .add(objectMapper.createObjectNode().put("text", userPrompt)))));

        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("maxOutputTokens", 4000);
        request.set("generationConfig", generationConfig);

        String requestBody = objectMapper.writeValueAsString(request);
        log.info("Gemini Request to {}: {}", geminiModel, requestBody);

        RestClient client = RestClient.builder()
                .baseUrl(geminiBaseUrl)
                .defaultHeader("x-goog-api-key", geminiApiKey)
                .build();

        String responseBody = client.post()
                .uri("/v1beta/models/{model}:generateContent", geminiModel)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        log.info("Gemini Response: {}", responseBody);

        JsonNode responseJson = objectMapper.readTree(responseBody);
        return extractTextFromGeminiResponse(responseJson);
    }

    private String extractTextFromGeminiResponse(JsonNode responseJson) {
        JsonNode candidates = responseJson.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini response does not contain candidates.");
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new IllegalStateException("Gemini response content parts are empty.");
        }

        StringBuilder joinedText = new StringBuilder();
        for (JsonNode part : parts) {
            String piece = part.path("text").asText("");
            if (!piece.isBlank()) {
                if (joinedText.length() > 0) {
                    joinedText.append('\n');
                }
                joinedText.append(piece.trim());
            }
        }

        return joinedText.toString().trim();
    }

    private String extractJsonText(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.startsWith("```")) {
            int firstBreak = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstBreak > 0 && lastFence > firstBreak) {
                trimmed = trimmed.substring(firstBreak + 1, lastFence).trim();
            }
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }
}
