export interface Model {
  id: string;
  created: Date;
}

export interface CreateAppResponse {
  error?: string;
  message: string;
  url?: string;
}