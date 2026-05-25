package com.scrum.crm.repository;

import com.scrum.crm.entity.InteractionNote;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InteractionNoteRepository extends JpaRepository<InteractionNote, Long> {

    List<InteractionNote> findByCustomer_IdOrderByInteractionTimeDesc(Long customerId);

    List<InteractionNote> findByCustomer_IdAndCreatedBy_IdOrderByInteractionTimeDesc(Long customerId, Long createdById);

    long countByInteractionTimeGreaterThanEqual(LocalDateTime interactionTime);

    long countByCreatedAtGreaterThanEqual(LocalDateTime createdAt);

    @Query("""
            SELECT n FROM InteractionNote n
            JOIN FETCH n.customer
            JOIN FETCH n.createdBy
            ORDER BY n.interactionTime DESC
            """)
    List<InteractionNote> findRecentActivities(Pageable pageable);

    @Query("""
            SELECT n FROM InteractionNote n
            JOIN FETCH n.customer
            JOIN FETCH n.createdBy
            ORDER BY n.interactionTime DESC
            """)
    List<InteractionNote> findIssues(Pageable pageable);

    @Query("""
            SELECT n.interactionType, COUNT(n)
            FROM InteractionNote n
            GROUP BY n.interactionType
            """)
    List<Object[]> countByInteractionType();
}
