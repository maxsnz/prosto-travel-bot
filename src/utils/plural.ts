// plural(1, "день", "дня", "дней") => "день"
// plural(2, "день", "дня", "дней") => "дня"
// plural(5, "день", "дня", "дней") => "дней"

export const plural = (
  count: number,
  one: string,
  few: string,
  many: string
) => {
  const n = Math.abs(count);
  const n10 = n % 10;
  const n100 = n % 100;

  if (n100 >= 11 && n100 <= 19) {
    return many;
  }

  if (n10 === 1) {
    return one;
  }

  if (n10 >= 2 && n10 <= 4) {
    return few;
  }

  return many;
};

export const pluralDay = (count: number) => {
  return plural(count, "день", "дня", "дней");
};
