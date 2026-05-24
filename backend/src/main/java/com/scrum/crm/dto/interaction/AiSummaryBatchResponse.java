package com.scrum.crm.dto.interaction;

import java.util.List;

public record AiSummaryBatchResponse(
        String action,
        int total,
        int accepted,
        int skipped,
        List<AiSummaryBatchItemResponse> results
) {
}
