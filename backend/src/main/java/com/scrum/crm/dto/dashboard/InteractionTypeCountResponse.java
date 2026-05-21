package com.scrum.crm.dto.dashboard;

import com.scrum.crm.entity.InteractionType;

public record InteractionTypeCountResponse(
        InteractionType type,
        long count
) {
}
