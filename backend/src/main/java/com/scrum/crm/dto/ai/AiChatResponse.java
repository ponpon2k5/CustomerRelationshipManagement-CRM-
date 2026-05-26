package com.scrum.crm.dto.ai;

public record AiChatResponse(
        String response,
        String sql,
        boolean success,
        String error
) {}
