export const isValidDate = (date: string): boolean => {
  return !isNaN(new Date(date).getTime());
};
