package com.scrum.crm.service;

import com.scrum.crm.dto.user.UserCreateRequest;
import com.scrum.crm.dto.user.UserPageResponse;
import com.scrum.crm.dto.user.UserResponse;
import com.scrum.crm.dto.user.UserRoleStatusUpdateRequest;
import com.scrum.crm.dto.user.UserUpdateRequest;
import com.scrum.crm.entity.User;
import com.scrum.crm.entity.UserRole;
import com.scrum.crm.exception.ConflictException;
import com.scrum.crm.exception.ResourceNotFoundException;
import com.scrum.crm.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserManagementService {

    private final UserRepository userRepository;
    private final AdminAccessService adminAccessService;
    private final PasswordEncoder passwordEncoder;

    public UserPageResponse getUsers(Long actorId, UserRole role, Boolean isActive, int page, int size) {
        adminAccessService.requireActiveAdmin(actorId);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<User> result = userRepository.findUsers(role, isActive, PageRequest.of(safePage, safeSize));
        List<UserResponse> items = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new UserPageResponse(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional
    public UserResponse createUser(Long actorId, UserCreateRequest request) {
        adminAccessService.requireActiveAdmin(actorId);

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Email already exists: " + normalizedEmail);
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setIsActive(request.isActive() == null || request.isActive());

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRoleStatus(Long actorId, Long targetUserId, UserRoleStatusUpdateRequest request) {
        adminAccessService.requireActiveAdmin(actorId);

        if (request.role() == null && request.isActive() == null) {
            throw new IllegalArgumentException("Role or status is required.");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        if (request.role() != null) {
            user.setRole(request.role());
        }

        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long actorId, Long targetUserId, UserUpdateRequest request) {
        adminAccessService.requireActiveAdmin(actorId);

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, targetUserId)) {
            throw new ConflictException("Email already exists: " + normalizedEmail);
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setRole(request.role());
        user.setIsActive(request.isActive());

        String newPassword = request.password();
        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6 || newPassword.length() > 72) {
                throw new IllegalArgumentException("Password must be between 6 and 72 characters.");
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        return toResponse(userRepository.save(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
