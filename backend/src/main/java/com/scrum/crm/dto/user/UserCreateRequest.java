package com.scrum.crm.dto.user;

import com.scrum.crm.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 100, message = "Full name must be at most 100 characters.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email format is invalid.")
        @Size(max = 150, message = "Email must be at most 150 characters.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, max = 72, message = "Password must be between 6 and 72 characters.")
        String password,

        @NotNull(message = "Role is required.")
        UserRole role,

        Boolean isActive
) {
}
