export interface BookAiMetadata {
  categories: string[];
  description: string;
}

export interface Book {
  title: string;
  price: number;
  availability: string;
  content: string;
  rating: number;
  url: string;
  metadata?: BookAiMetadata;
}
