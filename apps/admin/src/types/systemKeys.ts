export interface SystemKey {
  id: string;
  version: string;
  createdAt: string;
  author: string | null;
  counter: number;
  active: boolean;
}

export interface RotatedSystemKey {
  id: string;
  version: string;
}
