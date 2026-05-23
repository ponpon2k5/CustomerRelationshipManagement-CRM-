package com.scrum.crm.entity;

import java.util.Locale;

public enum InteractionStatus {
    SATISFIED,
    EXCITED,
    FRUSTRATED,
    CONFUSED,
    NEUTRAL;

    public static InteractionStatus fromDatabase(String value) {
        if (value == null || value.isBlank()) {
            return NEUTRAL;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "SATISFIED", "HAPPY", "PLEASED" -> SATISFIED;
            case "EXCITED", "ENTHUSIASTIC" -> EXCITED;
            case "FRUSTRATED", "DISAPPOINTED", "UPSET" -> FRUSTRATED;
            case "CONFUSED", "UNCLEAR" -> CONFUSED;
            case "NEUTRAL" -> NEUTRAL;
            default -> NEUTRAL;
        };
    }

    public String toDatabase() {
        return name().toLowerCase(Locale.ROOT);
    }
}
