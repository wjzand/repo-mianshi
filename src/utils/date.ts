import {
  format,
  formatDistanceToNow,
  differenceInDays,
  parseISO,
  isDate,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

type DateInput = Date | string | number;

function parseDate(date: DateInput): Date {
  if (isDate(date)) {
    return date as Date;
  }
  if (typeof date === 'string') {
    return parseISO(date);
  }
  if (typeof date === 'number') {
    return new Date(date);
  }
  return new Date();
}

export function formatDate(date: DateInput, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    const d = parseDate(date);
    return format(d, formatStr, { locale: zhCN });
  } catch {
    return '';
  }
}

export function formatDateTime(date: DateInput): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function getRelativeTime(date: DateInput): string {
  try {
    const d = parseDate(date);
    return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
  } catch {
    return '';
  }
}

export function getDaysBetween(date1: DateInput, date2: DateInput): number {
  try {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    return Math.abs(differenceInDays(d1, d2));
  } catch {
    return 0;
  }
}
