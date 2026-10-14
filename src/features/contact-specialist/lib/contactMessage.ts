export function contactMessage(serviceName?: string): string {
  const service = serviceName?.trim();
  return service
    ? `Здравствуйте! Хочу забронировать баню: ${service}${/[.!?]$/.test(service) ? '' : '.'} Подскажите, пожалуйста, стоимость и подтвердите свободное время.`
    : 'Здравствуйте! Хочу забронировать баню. Подскажите, пожалуйста, свободные даты и стоимость аренды по часам или со спальней на сутки.';
}
