//message, Status Code, Error Code, Error

export class HttpException extends Error {
  message: string;
  errorCode: ERRORCODES;
  statusCode: number;
  error: any;
  success: boolean;

  constructor(message: string, errorCode: ERRORCODES, statusCode: number, error: any) {
      super(message)
      this.message = message;
      this.statusCode = statusCode;
      this.errorCode = errorCode
      this.error = error
      this.success = false;
  } 
}

export enum ERRORCODES {
  "RESOURCE_NOT_FOUND" = 100,
  "USER_ALREADY_EXIST" = 101,
  "INCORRECT_PASSWORD" = 102,
  "UNPROCESSABLE_ENTITY" = 103,
  "INTERNAL_EXCEPTION" = 105,
  "UNAUTHORIZED" = 106,
  "BAD_REQUEST" = 107,
  "FORBIDDEN" = 108,
  "VALIDATION_ERROR" = 422
}