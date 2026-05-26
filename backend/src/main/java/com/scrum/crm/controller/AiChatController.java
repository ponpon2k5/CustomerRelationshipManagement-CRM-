package com.scrum.crm.controller;

import com.scrum.crm.dto.ai.AiChatRequest;
import com.scrum.crm.dto.ai.AiChatResponse;
import com.scrum.crm.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/chat")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
        return aiChatService.processChat(request.message());
    }

    @GetMapping("/temp-users")
    public List<Map<String, Object>> getTempUsers() {
        return jdbcTemplate.queryForList("SELECT id, email, role, is_active, full_name FROM public.users");
    }
}
