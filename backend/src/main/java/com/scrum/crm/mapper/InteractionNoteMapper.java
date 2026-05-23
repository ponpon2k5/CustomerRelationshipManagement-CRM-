package com.scrum.crm.mapper;

import com.scrum.crm.dto.interaction.InteractionNoteResponse;
import com.scrum.crm.entity.InteractionNote;

public final class InteractionNoteMapper {

    private InteractionNoteMapper() {
    }

    public static InteractionNoteResponse toResponse(InteractionNote note) {
        return new InteractionNoteResponse(
                note.getId(),
                note.getCustomer().getId(),
                note.getCreatedBy().getId(),
                note.getInteractionType(),
                note.getInteractionTime(),
                note.getTitle(),
                note.getDescription(),
                note.getPriority(),
                note.getStatus(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
