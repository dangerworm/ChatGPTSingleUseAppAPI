export interface Model {
  id: string;
  created: Date;
}

export interface GetModelsResponse {
  models: Model[]
}

export interface CreateAppResponse {
  error?: string;
  message: string;
  url?: string;
}