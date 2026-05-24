package com.scrum.crm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "interaction_summaries", schema = "public")
public class InteractionSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private InteractionNote note;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "raw_ai_response", columnDefinition = "text")
    private String rawAiResponse;

    @Column(name = "conversation_summary", columnDefinition = "text")
    private String conversationSummary;

    @Column(name = "customer_needs", columnDefinition = "text")
    private String customerNeeds;

    @Column(name = "pain_points", columnDefinition = "text")
    private String painPoints;

    @Column(name = "commitments", columnDefinition = "text")
    private String commitments;

    @Column(name = "next_steps", columnDefinition = "text")
    private String nextSteps;

    @Column(name = "risk_flags", columnDefinition = "text")
    private String riskFlags;

    @Column(name = "prompt_version", length = 20)
    private String promptVersion;

    @Column(name = "model_used", length = 50)
    private String modelUsed;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
