package com.scrum.crm.dto.interaction;

import com.scrum.crm.entity.InteractionType;
import java.time.LocalDateTime;

public record InteractionNoteResponse(
        Long id,
        Long customerId,
        Long createdById,
        InteractionType interactionType,
        LocalDateTime interactionTime,
        String noteContent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
