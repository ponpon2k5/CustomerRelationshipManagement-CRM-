package com.scrum.crm.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record SocialLoginRequest(
        @NotBlank String provider,
        @NotBlank String credential
) {
}
