/** Common Russian stop words to exclude from the search index to reduce noise. */
export const RUSSIAN_STOP_WORDS: string[] = [
  // Предлоги
  'в', 'на', 'с', 'по', 'для', 'от', 'из', 'к', 'у', 'за', 'до', 'об', 'при', 'без', 'про', 'о',
  // Союзы
  'и', 'но', 'или', 'а', 'что', 'как',
  // Частицы
  'не', 'да', 'нет', 'же', 'бы', 'ли', 'вот', 'ещё', 'уже',
  // Местоимения
  'я', 'мы', 'вы', 'он', 'она', 'они', 'оно', 'это',
  'мой', 'наш', 'ваш', 'его', 'её', 'их',
  // Вспомогательные
  'то', 'так', 'там', 'тут', 'все', 'всё', 'был', 'была', 'были', 'будет',
];

/**
 * Bidirectional synonym map for bakery-specific terms.
 * Meilisearch requires each direction to be declared explicitly.
 * Format: { word: [synonyms...] }
 */
export const BAKERY_SYNONYMS: Record<string, string[]> = {
  'торт': ['тортик', 'торты'],
  'тортик': ['торт', 'торты'],
  'торты': ['торт', 'тортик'],
  'безе': ['меренга'],
  'меренга': ['безе'],
  'чизкейк': ['чиз-кейк', 'сырный торт'],
  'чиз-кейк': ['чизкейк', 'сырный торт'],
  'сырный торт': ['чизкейк', 'чиз-кейк'],
  'макарон': ['макаронс', 'макаруны'],
  'макаронс': ['макарон', 'макаруны'],
  'макаруны': ['макарон', 'макаронс'],
  'эклер': ['эклеры', 'заварное'],
  'эклеры': ['эклер', 'заварное'],
  'заварное': ['эклер', 'эклеры'],
  'крем': ['кремовый'],
  'кремовый': ['крем'],
  'шоколад': ['шоколадный'],
  'шоколадный': ['шоколад'],
  'ваниль': ['ванильный'],
  'ванильный': ['ваниль'],
  'капкейк': ['капкейки', 'кекс'],
  'капкейки': ['капкейк', 'кекс'],
  'кекс': ['капкейк', 'капкейки'],
  'трайфл': ['трайфлы'],
  'трайфлы': ['трайфл'],
  'бенто-торт': ['бенто торт', 'бенто'],
  'бенто торт': ['бенто-торт', 'бенто'],
  'бенто': ['бенто-торт', 'бенто торт'],
  'крем-чиз': ['сливочный сыр', 'крем чиз'],
  'сливочный сыр': ['крем-чиз', 'крем чиз'],
  'крем чиз': ['крем-чиз', 'сливочный сыр'],
  'мастика': ['мастичный'],
  'мастичный': ['мастика'],
};

/**
 * Typo tolerance thresholds tuned for Russian, which has longer average word length
 * compared to English. Requires at least 4 characters for a single-character typo
 * and at least 8 for two-character typos.
 */
export const TYPO_TOLERANCE_CONFIG = {
  minWordSizeForTypos: {
    oneTypo: 4,
    twoTypos: 8,
  },
} as const;

/** Default page size for search result lists. */
export const SEARCH_DEFAULT_LIMIT = 6;

/** Meilisearch index name used for the products collection. */
export const MEILI_INDEX_NAME = 'products';
