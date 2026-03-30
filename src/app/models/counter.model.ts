export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface CounterData {
  title: string;
  categories: Category[];
}
