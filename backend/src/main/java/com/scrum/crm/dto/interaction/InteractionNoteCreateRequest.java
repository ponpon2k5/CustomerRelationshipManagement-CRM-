package com.scrum.crm.dto.interaction;

import com.scrum.crm.entity.InteractionPriority;
import com.scrum.crm.entity.InteractionStatus;
import com.scrum.crm.entity.InteractionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InteractionNoteCreateRequest {

    @NotNull
    private InteractionType interactionType;

    private LocalDateTime interactionTime;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private InteractionPriority priority;

    @NotNull
    private InteractionStatus status;

    @NotNull
    private Long createdById;
}
