package com.scrum.crm.dto.interaction;

public record AiSummaryRegenerateResponse(
        Long noteId,
        Long summaryId,
        String status
) {
}
