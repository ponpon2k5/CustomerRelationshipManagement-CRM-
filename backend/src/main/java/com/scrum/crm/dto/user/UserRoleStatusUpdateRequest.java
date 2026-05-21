package com.scrum.crm.dto.user;

import com.scrum.crm.entity.UserRole;

public record UserRoleStatusUpdateRequest(
        UserRole role,
        Boolean isActive
) {
}
