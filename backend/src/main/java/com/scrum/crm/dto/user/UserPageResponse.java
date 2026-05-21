package com.scrum.crm.dto.user;

import java.util.List;

public record UserPageResponse(
        List<UserResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
}
