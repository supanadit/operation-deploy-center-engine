// Author Supan Adit Pratama <supanadit@gmail.com>

export interface ResponseObject<T> {
    data: T;
    message: string;
    success: boolean;
}

export class DefaultResponse<T> implements ResponseObject<T> {
    data: T;
    message: string;
    success: boolean = true;

    constructor(response: ResponseObject<T>) {
        this.data = response.data;
        this.message = response.message;
        this.success = response.success;
    }

    static success<T>(message: string, content: { data: T } | null = null): DefaultResponse<T | Array<any>> {
        const response: ResponseObject<T | Array<any>> = {
            data: (content != null) ? content.data : [],
            message: message,
            success: true,
        };
        return new DefaultResponse(response);
    }

    static error<T>(message: string, content: { data: T } | null = null): DefaultResponse<T | Array<any>> {
        const response: ResponseObject<T | Array<any>> = {
            data: (content != null) ? content.data : [],
            message: message,
            success: false,
        };
        return new DefaultResponse(response);
    }
}
