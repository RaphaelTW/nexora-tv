export type Country = {
  name: string;
  code: string;
  languages: string[];
  flag: string;
};

export type Channel = {
  id: string;
  name: string;
  countryCode: string;
  countryName?: string;
  flag?: string;
  logo?: string;
  group?: string;
  quality?: string;
  url: string;
  referrer?: string;
  userAgent?: string;
};

export type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};
