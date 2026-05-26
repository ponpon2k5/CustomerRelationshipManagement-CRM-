package com.scrum.crm.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record AiChatRequest(
        @NotBlank(message = "Tin nhắn không được để trống.")
        String message
) {}
