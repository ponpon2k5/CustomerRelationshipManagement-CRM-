package com.scrum.crm.service;

import com.scrum.crm.entity.User;
import com.scrum.crm.entity.UserRole;
import com.scrum.crm.exception.ForbiddenException;
import com.scrum.crm.exception.ResourceNotFoundException;
import com.scrum.crm.exception.UnauthorizedException;
import com.scrum.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAccessService {

    private final UserRepository userRepository;

    public User requireActiveAdmin(Long actorId) {
        if (actorId == null) {
            throw new UnauthorizedException("Missing current user.");
        }

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found."));

        if (!Boolean.TRUE.equals(actor.getIsActive())) {
            throw new UnauthorizedException("User account is inactive.");
        }

        if (actor.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only ADMIN users can manage user accounts.");
        }

        return actor;
    }
}
