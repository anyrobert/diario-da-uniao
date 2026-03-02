import { IN_BASE_URL, IN_WEB_DOU_BASE_URL } from "./constants.ts";

export const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

export const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, " ");

export const formatToBrazilianDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

export const formatToConsultaDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

export const isBrazilianDate = (value: string): boolean => /^\d{2}\/\d{2}\/\d{4}$/.test(value);

export const toAbsoluteInUrl = (url: string): string => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${IN_BASE_URL}${url}`;
  }

  return `${IN_WEB_DOU_BASE_URL}${url}`;
};

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const roundMs = (value: number): number => Math.round(value * 100) / 100;
