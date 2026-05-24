package com.scrum.crm.repository;

import com.scrum.crm.entity.InteractionSummary;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InteractionSummaryRepository extends JpaRepository<InteractionSummary, Long> {

    Optional<InteractionSummary> findFirstByNote_IdOrderByCreatedAtDesc(Long noteId);

    List<InteractionSummary> findByNote_IdOrderByCreatedAtDesc(Long noteId);
}
