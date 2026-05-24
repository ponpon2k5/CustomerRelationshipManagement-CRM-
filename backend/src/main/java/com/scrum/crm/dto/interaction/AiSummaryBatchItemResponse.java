package com.scrum.crm.dto.interaction;

public record AiSummaryBatchItemResponse(
        Long noteId,
        String result,
        Long summaryId,
        String message
) {
}
