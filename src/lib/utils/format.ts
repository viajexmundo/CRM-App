/**
 * Format a number as currency using the es-GT locale.
 */
export function formatCurrency(
  amount: number,
  currency: string = "GTQ"
): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date as dd/MM/yyyy.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date as dd/MM/yyyy HH:mm.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format a date as a relative string in Spanish.
 * e.g., "hace 2 horas", "hace 3 d\u00edas", "hace 1 mes"
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return "hace un momento";
  }
  if (diffMinutes === 1) {
    return "hace 1 minuto";
  }
  if (diffMinutes < 60) {
    return `hace ${diffMinutes} minutos`;
  }
  if (diffHours === 1) {
    return "hace 1 hora";
  }
  if (diffHours < 24) {
    return `hace ${diffHours} horas`;
  }
  if (diffDays === 1) {
    return "hace 1 d\u00eda";
  }
  if (diffDays < 7) {
    return `hace ${diffDays} d\u00edas`;
  }
  if (diffWeeks === 1) {
    return "hace 1 semana";
  }
  if (diffWeeks < 4) {
    return `hace ${diffWeeks} semanas`;
  }
  if (diffMonths === 1) {
    return "hace 1 mes";
  }
  if (diffMonths < 12) {
    return `hace ${diffMonths} meses`;
  }
  if (diffYears === 1) {
    return "hace 1 a\u00f1o";
  }
  return `hace ${diffYears} a\u00f1os`;
}

/**
 * Format a phone number for display.
 * Attempts to format as (XXX) XXXX-XXXX for 8+ digit numbers.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  // International format
  if (digits.length > 11) {
    return `+${digits.slice(0, digits.length - 8)} ${digits.slice(-8, -4)}-${digits.slice(-4)}`;
  }

  return phone;
}

/**
 * Normalize an email address: lowercase and trim.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize a phone number: keep digits only.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
