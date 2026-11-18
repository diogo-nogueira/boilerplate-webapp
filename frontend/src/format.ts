// Datas e números para mostrar na interface. Funções puras, testadas em format.test.ts.

const SHORT_MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const DAY_MS = 24 * 60 * 60 * 1000;

// As datas da API são dias sem hora. Usar UTC evita que a mudança de hora
// ou o fuso do browser troquem o dia.
function parseDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  return toIsoDay(new Date(parseDay(isoDate).getTime() + days * DAY_MS));
}

// Hoje no calendário do utilizador, como AAAA-MM-DD (e não em UTC, que à
// noite já pode ser outro dia).
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatShortDate(isoDate: string): string {
  const date = parseDay(isoDate);
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
}

// "9 nov" ou, num intervalo, "9 a 13 nov" / "30 nov a 4 dez"
export function formatDayRange(startIso: string, endIso: string): string {
  if (startIso === endIso) {
    return formatShortDate(startIso);
  }
  const start = parseDay(startIso);
  const end = parseDay(endIso);
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()} a ${formatShortDate(endIso)}`;
  }
  return `${formatShortDate(startIso)} a ${formatShortDate(endIso)}`;
}

const quantityFormat = new Intl.NumberFormat("pt-PT");

// Separador de milhares e vírgula decimal, como em Portugal.
export function formatQuantity(value: number): string {
  return quantityFormat.format(value);
}
