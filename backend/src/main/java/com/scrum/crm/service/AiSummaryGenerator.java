package com.scrum.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.scrum.crm.entity.InteractionNote;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
@RequiredArgsConstructor
public class AiSummaryGenerator {

    private static final String SYSTEM_PROMPT = """
            Ban la tro ly CRM chuyen nghiep.
            Nhiem vu: tom tat ghi chu sau moi lan tuong tac voi khach hang.

            Quy tac bat buoc:
            - Chi su dung thong tin co trong note, KHONG suy doan them.
            - Neu thieu thong tin thi ghi "unknown".
            - Tra ve JSON hop le, KHONG giai thich them.
            - Giu nguyen ten, so lieu, ngay thang dung voi du lieu goc.
            - Toan bo noi dung output phai viet bang TIENG VIET (tru cac tu khoa JSON va gia tri "unknown"/"none").

            Output JSON schema:
            {
              "conversation_summary": "Tom tat noi dung chinh 3-5 cau",
              "customer_needs": "Nhu cau khach hang de cap",
              "pain_points": "Van de khach hang dang gap, hoac unknown",
              "commitments": "Nhung cam ket cua nhan vien, hoac unknown",
              "next_steps": "Buoc tiep theo + deadline neu co, hoac unknown",
              "risk_flags": "Rui ro phat hien duoc, hoac none"
            }
            """;

    private static final List<String> REQUIRED_FIELDS = List.of(
            "conversation_summary",
            "customer_needs",
            "pain_points",
            "commitments",
            "next_steps",
            "risk_flags"
    );

    private final ObjectMapper objectMapper;

    @Value("${crm.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${crm.ai.gemini.base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    @Value("${crm.ai.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${crm.ai.max-output-tokens:700}")
    private int maxOutputTokens;

    @Value("${crm.ai.use-mock-when-no-key:true}")
    private boolean useMockWhenNoKey;

    @Value("${crm.ai.fallback-when-quota-exceeded:true}")
    private boolean fallbackWhenQuotaExceeded;

    @Value("${crm.ai.fallback-when-invalid-json:true}")
    private boolean fallbackWhenInvalidJson;

    public GenerationResult generate(InteractionNote note) {
        String prompt = buildUserPrompt(note);
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            if (!useMockWhenNoKey) {
                throw new IllegalStateException("Missing Gemini API key.");
            }
            StructuredSummary mock = mockSummary(note.getDescription());
            String raw = toJson(mock);
            return new GenerationResult(prompt, raw, mock, 0, "mock-local");
        }

        return generateFromGemini(note, prompt);
    }

    private GenerationResult generateFromGemini(InteractionNote note, String prompt) {
        try {
            ObjectNode request = objectMapper.createObjectNode();

            ObjectNode systemInstruction = objectMapper.createObjectNode();
            systemInstruction.set("parts", objectMapper.createArrayNode()
                    .add(objectMapper.createObjectNode().put("text", SYSTEM_PROMPT)));
            request.set("systemInstruction", systemInstruction);

            request.set("contents", objectMapper.createArrayNode()
                    .add(objectMapper.createObjectNode()
                            .put("role", "user")
                            .set("parts", objectMapper.createArrayNode()
                                    .add(objectMapper.createObjectNode().put("text", prompt)))));

            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("temperature", 0);
            generationConfig.put("maxOutputTokens", maxOutputTokens);
            generationConfig.put("responseMimeType", "application/json");
            request.set("generationConfig", generationConfig);

            String requestBody = objectMapper.writeValueAsString(request);

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

            JsonNode responseJson = objectMapper.readTree(responseBody);
            int tokensUsed = readTokensUsed(responseJson);
            String text = extractTextFromGeminiResponse(responseJson);
            StructuredSummary parsed = parseSummaryWithFallback(note, text);
            return new GenerationResult(prompt, responseBody, parsed, tokensUsed, geminiModel);
        } catch (RestClientResponseException ex) {
            if (isQuotaExceeded(ex) && fallbackWhenQuotaExceeded) {
                StructuredSummary mock = mockSummary(note.getDescription());
                String raw = toJson(mock);
                return new GenerationResult(prompt, raw, mock, 0, "mock-quota-fallback");
            }
            if (isQuotaExceeded(ex)) {
                throw new IllegalStateException(
                        "Gemini quota exceeded. Please check billing/quota for this API key.", ex);
            }
            throw new IllegalStateException("AI generation failed: " + ex.getMessage(), ex);
        } catch (Exception ex) {
            throw new IllegalStateException("AI generation failed: " + ex.getMessage(), ex);
        }
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

        String text = joinedText.toString().trim();
        if (text.isBlank()) {
            throw new IllegalStateException("Gemini response text is empty.");
        }
        return text;
    }

    private int readTokensUsed(JsonNode responseJson) {
        JsonNode usage = responseJson.path("usageMetadata");
        return usage.path("totalTokenCount").asInt(
                usage.path("promptTokenCount").asInt(0) + usage.path("candidatesTokenCount").asInt(0));
    }

    private boolean isQuotaExceeded(RestClientResponseException ex) {
        if (ex.getStatusCode().value() != 429) {
            return false;
        }
        String body = ex.getResponseBodyAsString();
        if (body == null) {
            return false;
        }
        String normalized = body.toLowerCase();
        return normalized.contains("quota") || normalized.contains("resource_exhausted");
    }

    private StructuredSummary mockSummary(String noteDescription) {
        String text = noteDescription == null ? "" : noteDescription.trim();
        String summary = text.isBlank() ? "unknown" : clip(text, 450);
        return new StructuredSummary(summary, "unknown", "unknown", "unknown", "unknown", "none");
    }

    private String toJson(StructuredSummary summary) {
        try {
            return objectMapper.writeValueAsString(summary);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot serialize summary json.", ex);
        }
    }

    private String extractJsonText(String text) {
        String trimmed = text == null ? "" : text.trim();
        try {
            JsonNode asJson = objectMapper.readTree(trimmed);
            if (asJson != null && asJson.isObject()) {
                return trimmed;
            }
        } catch (Exception ignored) {
            // fall through to fence/braces extraction
        }

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
        throw new IllegalStateException("Model did not return a JSON object.");
    }

    private StructuredSummary parseSummaryWithFallback(InteractionNote note, String rawText) {
        try {
            String jsonText = extractJsonText(rawText);
            return parseAndValidate(jsonText);
        } catch (Exception ex) {
            if (!fallbackWhenInvalidJson) {
                throw ex;
            }
            return mockSummary(note.getDescription());
        }
    }

    private StructuredSummary parseAndValidate(String rawJson) {
        try {
            JsonNode node = objectMapper.readTree(rawJson);
            for (String field : REQUIRED_FIELDS) {
                if (!node.has(field)) {
                    throw new IllegalStateException("Missing field: " + field);
                }
            }
            String conversationSummary = sanitize(node.path("conversation_summary").asText(""));
            if (conversationSummary.length() > 1000) {
                throw new IllegalStateException("conversation_summary exceeds 1000 chars.");
            }

            return new StructuredSummary(
                    conversationSummary,
                    sanitize(node.path("customer_needs").asText("unknown")),
                    sanitize(node.path("pain_points").asText("unknown")),
                    sanitize(node.path("commitments").asText("unknown")),
                    sanitize(node.path("next_steps").asText("unknown")),
                    sanitize(node.path("risk_flags").asText("none"))
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid AI JSON response: " + ex.getMessage(), ex);
        }
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return clip(value.trim(), 2000);
    }

    private String clip(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private String buildUserPrompt(InteractionNote note) {
        String customerName = note.getCustomer() != null ? safe(note.getCustomer().getFullName()) : "unknown";
        String company = note.getCustomer() != null ? safe(note.getCustomer().getCompany()) : "unknown";
        String staffName = note.getCreatedBy() != null ? safe(note.getCreatedBy().getFullName()) : "unknown";
        String interactionTime = note.getInteractionTime() != null ? note.getInteractionTime().toString() : "unknown";
        String interactionType = note.getInteractionType() != null ? note.getInteractionType().name() : "unknown";
        String description = safe(note.getDescription());

        return """
                Khach hang: %s (%s)
                Nhan vien: %s
                Ngay: %s
                Loai tuong tac: %s

                Noi dung ghi chu:
                %s
                """.formatted(customerName, company, staffName, interactionTime, interactionType, description);
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.trim();
    }

    public record StructuredSummary(
            String conversationSummary,
            String customerNeeds,
            String painPoints,
            String commitments,
            String nextSteps,
            String riskFlags
    ) {
    }

    public record GenerationResult(
            String promptSent,
            String rawResponse,
            StructuredSummary summary,
            int tokensUsed,
            String modelUsed
    ) {
    }
}
