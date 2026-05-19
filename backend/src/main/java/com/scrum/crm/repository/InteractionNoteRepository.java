package com.scrum.crm.repository;

import com.scrum.crm.entity.InteractionNote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InteractionNoteRepository extends JpaRepository<InteractionNote, Long> {

    List<InteractionNote> findByCustomer_IdOrderByInteractionTimeDesc(Long customerId);
}
