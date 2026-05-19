package com.scrum.crm.dto.interaction;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InteractionNoteUpdateRequest {

    @NotBlank
    private String noteContent;
}
