package com.scrum.crm.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class InteractionStatusConverter implements AttributeConverter<InteractionStatus, String> {

    @Override
    public String convertToDatabaseColumn(InteractionStatus attribute) {
        return attribute == null ? null : attribute.toDatabase();
    }

    @Override
    public InteractionStatus convertToEntityAttribute(String dbData) {
        return InteractionStatus.fromDatabase(dbData);
    }
}