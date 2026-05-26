package com.scrum.crm.controller;

import com.scrum.crm.dto.user.UserCreateRequest;
import com.scrum.crm.dto.user.UserPageResponse;
import com.scrum.crm.dto.user.UserResponse;
import com.scrum.crm.dto.user.UserRoleStatusUpdateRequest;
import com.scrum.crm.dto.user.UserUpdateRequest;
import com.scrum.crm.entity.UserRole;
import com.scrum.crm.service.UserManagementService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserManagementService userManagementService;

    @GetMapping
    public UserPageResponse getUsers(
            @RequestHeader("X-User-Id") Long actorId,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return userManagementService.getUsers(actorId, role, parseStatus(status), page, size);
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestHeader("X-User-Id") Long actorId,
            @Valid @RequestBody UserCreateRequest request
    ) {
        UserResponse response = userManagementService.createUser(actorId, request);
        return ResponseEntity.created(URI.create("/api/users/" + response.id())).body(response);
    }

    @PutMapping("/{id}/role-status")
    public UserResponse updateRoleStatus(
            @RequestHeader("X-User-Id") Long actorId,
            @PathVariable Long id,
            @RequestBody UserRoleStatusUpdateRequest request
    ) {
        return userManagementService.updateRoleStatus(actorId, id, request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @RequestHeader("X-User-Id") Long actorId,
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        return userManagementService.updateUser(actorId, id, request);
    }

    private Boolean parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        return switch (status.trim().toUpperCase()) {
            case "ACTIVE" -> true;
            case "INACTIVE" -> false;
            default -> throw new IllegalArgumentException("Status must be ACTIVE or INACTIVE.");
        };
    }
}
