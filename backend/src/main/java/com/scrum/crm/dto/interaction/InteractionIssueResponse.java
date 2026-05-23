package com.scrum.crm.dto.interaction;

import com.scrum.crm.entity.InteractionPriority;
import com.scrum.crm.entity.InteractionStatus;
import com.scrum.crm.entity.InteractionType;
import java.time.LocalDateTime;

public record InteractionIssueResponse(
        Long id,
        String title,
        String description,
        InteractionType interactionType,
        LocalDateTime interactionTime,
        InteractionPriority priority,
        InteractionStatus status,
        Long customerId,
        String customerName,
        String customerEmail,
        String customerPhone,
        String customerCompany,
        Long createdById,
        String createdByName
) {
}

