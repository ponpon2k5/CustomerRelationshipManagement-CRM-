package com.scrum.crm.dto.interaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AiSummaryBatchRequest(
        @NotEmpty List<Long> noteIds,
        @NotBlank String action
) {
}
