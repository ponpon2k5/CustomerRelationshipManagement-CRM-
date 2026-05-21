package com.scrum.crm.repository;

import com.scrum.crm.entity.User;
import com.scrum.crm.entity.UserRole;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query(
            value = """
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:isActive IS NULL OR u.isActive = :isActive)
            ORDER BY u.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(u) FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:isActive IS NULL OR u.isActive = :isActive)
            """
    )
    Page<User> findUsers(
            @Param("role") UserRole role,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}
