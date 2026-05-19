package com.scrum.crm.dto.auth;

import com.scrum.crm.entity.UserRole;

public record LoginResponse(
        Long id,
        String fullName,
        String email,
        UserRole role
) {
}
