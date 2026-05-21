package com.scrum.crm.dto.dashboard;

public record CustomerStatusCountResponse(
        String status,
        long count
) {
}
