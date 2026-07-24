import { Alert, Platform } from "react-native";

interface IFetchProps {
  method: string;
  url: string | URL;
  abortController?: AbortController;
  body?: unknown;
  multipart?: boolean;
  isRetry?: boolean;
  useCookie?: boolean;
  silent?: boolean;
  skipAuth?: boolean;
}

export interface IResult<T> {
  data: T;
  message: string;
  code: string;
}

export interface IFetchError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: unknown;
}

const REQUEST_TIMEOUT = 15000;

const Fetch = async <TResponseData>({
  method,
  url,
  body,
  multipart,
  abortController,
  silent = false,
}: IFetchProps): Promise<IResult<TResponseData>> => {
  let urlStr = typeof url === "string" ? url : url.toString();

  // Automatically prepend Supabase PostgREST API base url if path is relative
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  if (urlStr.startsWith('/')) {
    urlStr = `${supabaseUrl}/rest/v1${urlStr}`;
  }

  const controller = abortController || new AbortController();
  const headers: HeadersInit = {};

  // Attach Supabase RLS bypass / Anon Auth headers
  const isSupabaseRequest = urlStr.includes(supabaseUrl);
  if (isSupabaseRequest) {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    headers['apikey'] = anonKey;
    headers['Authorization'] = `Bearer ${anonKey}`;
    
    // Tell PostgREST to return the representation of the updated/inserted rows
    if (method === 'POST' || method === 'PATCH') {
      headers['Prefer'] = 'return=representation';
    }
  }

  if (!multipart) {
    headers["Content-Type"] = "application/json";
  }

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
    body: multipart ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
  };

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    console.log("REQUEST:", {
      method,
      url: urlStr,
      body,
    });

    const response = await fetch(urlStr, options);

    clearTimeout(timeoutId);

    console.log("RESPONSE STATUS:", response.status);

    const data = await parseResponse(response, method);

    if (!response.ok) {
      throw {
        ...data,
        statusCode: response.status,
      };
    }

    return data as IResult<TResponseData>;
  } catch (error) {
    clearTimeout(timeoutId);

    const isNetworkError =
      error instanceof TypeError ||
      (typeof (error as any)?.message === "string" &&
        /(network request failed|failed to fetch|networkerror)/i.test(
          (error as any).message
        ));

    if (isNetworkError) {
      const networkError: IFetchError = {
        code: "NETWORK_ERROR",
        statusCode: 0,
        message: "Please check your internet connection.",
      };

      if (!silent) {
        ErrorHandler({ error: networkError });
      }

      throw networkError;
    }

    if (controller.signal.aborted) {
      const timeoutError: IFetchError = {
        message: "Request timeout. Please try again.",
        statusCode: 408,
      };

      if (!silent) {
        ErrorHandler({
          error: timeoutError,
        });
      }

      throw timeoutError;
    }

    if (!silent) {
      ErrorHandler({
        error: error as IFetchError,
      });
    }

    throw error;
  }
};

async function parseResponse(response: Response, method: string) {
  const text = await response.text();

  if (!text) {
    return {
      message: "",
      code: "",
      data: null,
    };
  }

  try {
    const parsed = JSON.parse(text);
    
    // PostgREST returns created/updated records in an array by default (e.g. `[{ id: 1 }]`).
    // If it's a mutation (POST/PATCH) and it returned a single-item array, extract it.
    let finalData = parsed;
    if (Array.isArray(parsed) && (method === 'POST' || method === 'PATCH')) {
      finalData = parsed[0] || null;
    }

    // Keep it wrapped in standard IResult structure
    if (finalData && typeof finalData === 'object' && 'data' in finalData) {
      return finalData;
    }

    return {
      data: finalData,
      message: "",
      code: "",
    };
  } catch {
    return {
      message: text,
      code: "",
      data: null,
    };
  }
}

const ErrorHandler = ({ error }: { error: IFetchError }) => {
  if (error instanceof TypeError) {
    Alert.alert("Network Error", "Please check your internet connection.");
    return;
  }

  switch (error.statusCode) {
    case 400:
      Alert.alert("Bad Request", error.message || "Invalid request.");
      break;

    case 403:
      Alert.alert("Access Denied", error.message || "You do not have access.");
      break;

    case 404:
      Alert.alert("Not Found", error.message || "Requested resource not found.");
      break;

    case 408:
      Alert.alert("Timeout", error.message || "Request timeout.");
      break;

    case 500:
      Alert.alert("Server Error", error.message || "Something went wrong.");
      break;

    default:
      if (error.message) {
        Alert.alert("Request Failed", error.message);
      }
  }
};

export default Fetch;
