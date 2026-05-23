package com.scrum.crm.dto.dashboard;

import com.scrum.crm.entity.InteractionType;
import java.time.LocalDateTime;

public record RecentActivityResponse(
        Long id,
        Long customerId,
        String customerName,
        String companyName,
        InteractionType interactionType,
        LocalDateTime interactionTime,
        String title,
        String description
) {
}
