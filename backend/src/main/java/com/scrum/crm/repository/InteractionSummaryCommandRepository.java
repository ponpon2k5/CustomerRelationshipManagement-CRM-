package com.scrum.crm.repository;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class InteractionSummaryCommandRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public Long createPendingSummary(Long noteId, String promptVersion, String modelUsed) {
        String sql = """
                INSERT INTO public.interaction_summaries (note_id, status, prompt_version, model_used)
                VALUES (:noteId, CAST('pending' AS ai_summary_status), :promptVersion, :modelUsed)
                RETURNING id
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("noteId", noteId)
                .addValue("promptVersion", promptVersion)
                .addValue("modelUsed", modelUsed);
        return jdbcTemplate.queryForObject(sql, params, Long.class);
    }

    public void markSummaryProcessing(Long summaryId) {
        jdbcTemplate.update(
                """
                UPDATE public.interaction_summaries
                SET status = CAST('processing' AS ai_summary_status),
                    error_message = NULL
                WHERE id = :summaryId
                """,
                Map.of("summaryId", summaryId)
        );
    }

    public void markSummaryCompleted(
            Long summaryId,
            String rawAiResponse,
            String conversationSummary,
            String customerNeeds,
            String painPoints,
            String commitments,
            String nextSteps,
            String riskFlags,
            Integer tokensUsed
    ) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("summaryId", summaryId)
                .addValue("rawAiResponse", rawAiResponse)
                .addValue("conversationSummary", conversationSummary)
                .addValue("customerNeeds", customerNeeds)
                .addValue("painPoints", painPoints)
                .addValue("commitments", commitments)
                .addValue("nextSteps", nextSteps)
                .addValue("riskFlags", riskFlags)
                .addValue("tokensUsed", tokensUsed);

        jdbcTemplate.update(
                """
                UPDATE public.interaction_summaries
                SET status = CAST('completed' AS ai_summary_status),
                    raw_ai_response = :rawAiResponse,
                    conversation_summary = :conversationSummary,
                    customer_needs = :customerNeeds,
                    pain_points = :painPoints,
                    commitments = :commitments,
                    next_steps = :nextSteps,
                    risk_flags = :riskFlags,
                    tokens_used = :tokensUsed,
                    error_message = NULL,
                    completed_at = NOW()
                WHERE id = :summaryId
                """,
                params
        );
    }

    public void markSummaryFailed(Long summaryId, String errorMessage, String rawAiResponse) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("summaryId", summaryId)
                .addValue("errorMessage", errorMessage)
                .addValue("rawAiResponse", rawAiResponse);

        jdbcTemplate.update(
                """
                UPDATE public.interaction_summaries
                SET status = CAST('failed' AS ai_summary_status),
                    error_message = :errorMessage,
                    raw_ai_response = COALESCE(:rawAiResponse, raw_ai_response),
                    completed_at = NOW()
                WHERE id = :summaryId
                """,
                params
        );
    }

    public void markNotePending(Long noteId) {
        markNoteStatus(noteId, "pending");
    }

    public void markNoteProcessing(Long noteId) {
        markNoteStatus(noteId, "processing");
    }

    public void markNoteCompleted(Long noteId) {
        markNoteStatus(noteId, "completed");
    }

    public void markNoteFailed(Long noteId) {
        markNoteStatus(noteId, "failed");
    }

    private void markNoteStatus(Long noteId, String status) {
        jdbcTemplate.update(
                """
                UPDATE public.interaction_notes
                SET summary_status = CAST(:status AS ai_summary_status)
                WHERE id = :noteId
                """,
                Map.of("noteId", noteId, "status", status)
        );
    }
}
