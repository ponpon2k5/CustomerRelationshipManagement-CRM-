const TYPE_LABELS = {
  PHONE_CALL: 'Call',
  EMAIL: 'Email',
  IN_PERSON: 'Meeting',
  OTHER: 'Other',
}

export function toTimelineItem(interaction) {
  return {
    id: interaction.id,
    type: TYPE_LABELS[interaction.interactionType] || interaction.interactionType,
    text: interaction.noteContent,
    date: interaction.interactionTime,
  }
}

export function toNoteItem(interaction) {
  return {
    id: interaction.id,
    text: interaction.noteContent,
    date: interaction.interactionTime,
  }
}

export function toDatetimeLocalValue(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toApiDateTime(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}
