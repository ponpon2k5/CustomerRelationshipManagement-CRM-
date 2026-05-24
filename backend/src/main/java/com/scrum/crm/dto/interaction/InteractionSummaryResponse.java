package com.scrum.crm.dto.interaction;

import com.scrum.crm.entity.AiSummaryStatus;
import java.time.OffsetDateTime;

public record InteractionSummaryResponse(
        Long id,
        Long noteId,
        AiSummaryStatus status,
        String conversationSummary,
        String customerNeeds,
        String painPoints,
        String commitments,
        String nextSteps,
        String riskFlags,
        String promptVersion,
        String modelUsed,
        Integer tokensUsed,
        String errorMessage,
        OffsetDateTime createdAt,
        OffsetDateTime completedAt
) {
}
