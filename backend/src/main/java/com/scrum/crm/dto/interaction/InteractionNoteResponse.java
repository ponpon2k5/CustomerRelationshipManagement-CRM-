package com.scrum.crm.dto.interaction;

import com.scrum.crm.entity.InteractionPriority;
import com.scrum.crm.entity.InteractionStatus;
import com.scrum.crm.entity.InteractionType;
import com.scrum.crm.entity.AiSummaryStatus;
import java.time.LocalDateTime;

public record InteractionNoteResponse(
        Long id,
        Long customerId,
        Long createdById,
        InteractionType interactionType,
        LocalDateTime interactionTime,
        String title,
        String description,
        InteractionPriority priority,
        InteractionStatus status,
        AiSummaryStatus summaryStatus,
        InteractionSummaryResponse latestSummary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
