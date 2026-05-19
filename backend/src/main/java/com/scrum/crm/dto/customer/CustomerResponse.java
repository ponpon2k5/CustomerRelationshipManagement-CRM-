package com.scrum.crm.dto.customer;

import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String company,
        String address,
        Boolean isActive,
        Long createdById,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
