export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public serverMessage: string,
  ) {
    super(`[${statusCode}] ${serverMessage}`)
    this.name = 'ApiError'
  }
}
