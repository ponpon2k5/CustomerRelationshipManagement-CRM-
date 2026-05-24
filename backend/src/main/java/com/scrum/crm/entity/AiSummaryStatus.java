package com.scrum.crm.entity;

public enum AiSummaryStatus {
    PENDING("pending"),
    PROCESSING("processing"),
    COMPLETED("completed"),
    FAILED("failed");

    private final String value;

    AiSummaryStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static AiSummaryStatus fromValue(String value) {
        if (value == null || value.isBlank()) {
            return PENDING;
        }
        for (AiSummaryStatus status : values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unsupported ai summary status: " + value);
    }
}
