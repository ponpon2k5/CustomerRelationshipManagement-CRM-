const TYPE_LABELS = {
  PHONE_CALL: 'Call',
  EMAIL: 'Email',
  IN_PERSON: 'Meeting',
  OTHER: 'Other',
}

const PRIORITY_LABELS = {
  HIGHEST: 'Highest',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  VERY_LOW: 'Very low',
}

const STATUS_LABELS = {
  SATISFIED: 'Satisfied',
  EXCITED: 'Excited',
  FRUSTRATED: 'Frustrated',
  CONFUSED: 'Confused',
  NEUTRAL: 'Neutral',
}

export function toTimelineItem(interaction) {
  const priority = String(interaction.priority || 'MEDIUM').toUpperCase()
  const status = String(interaction.status || 'NEUTRAL').toUpperCase()

  return {
    id: interaction.id,
    type: TYPE_LABELS[interaction.interactionType] || interaction.interactionType,
    interactionType: interaction.interactionType,
    title: interaction.title || 'Interaction Note',
    text: interaction.description || '',
    priority,
    priorityLabel: PRIORITY_LABELS[priority] || PRIORITY_LABELS.MEDIUM,
    emotionStatus: status,
    emotionLabel: STATUS_LABELS[status] || STATUS_LABELS.NEUTRAL,
    date: interaction.interactionTime,
  }
}

export function toNoteItem(interaction) {
  return {
    id: interaction.id,
    text: interaction.title ? `${interaction.title}: ${interaction.description}` : interaction.description,
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

