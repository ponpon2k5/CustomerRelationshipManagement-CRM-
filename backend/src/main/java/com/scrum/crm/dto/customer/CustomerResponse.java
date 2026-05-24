package com.scrum.crm.dto.customer;

import com.scrum.crm.entity.CustomerStage;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String company,
        String address,
        Boolean isActive,
        CustomerStage customerStage,
        Long createdById,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
