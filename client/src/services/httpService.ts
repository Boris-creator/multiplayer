import { BASE_URL } from "@/constants";

export class HttpService {
  private static async fetch<T>(url: string, options?: RequestInit) {
    const response = await fetch(BASE_URL + url, options);
    if (!response.ok) {
      //throw new Error();
    }
    return {
      ...response,
      data: (await response.json()) as T,
    };
  }

  static post<T>(
    url: string,
    payload?: Record<any, any>,
    options?: RequestInit
  ) {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "charset=utf-8",
      },
      body: JSON.stringify(payload),
      ...options,
    };
    return this.fetch<T>(url, requestOptions);
  }
  static get<T>(url: string, options?: RequestInit) {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      ...options,
    };
    return this.fetch<T>(url, requestOptions);
  }
}
