export interface ApiResponse<T> {
  data: T;
  meta?: {
    count: number;
  };
}

export interface ApiError {
  error: string;
  statusCode: number;
}
