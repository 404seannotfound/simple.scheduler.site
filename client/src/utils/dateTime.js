function formatDateByPattern(parts, dateFormat) {
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;

  switch (dateFormat) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'MM/dd/yyyy':
    default:
      return `${month}/${day}/${year}`;
  }
}

export function formatDateTime(value, dateFormat = 'MM/dd/yyyy', timezone = 'UTC') {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  });

  const parts = partsFormatter
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(date);

  return `${formatDateByPattern(parts, dateFormat)} ${time} (${timezone})`;
}
