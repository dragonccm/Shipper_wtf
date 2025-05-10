import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePath } from '@/lib/utils';
import { Alert } from 'react-native';

// Định nghĩa các hằng số
const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;
// Sử dụng trực tiếp giá trị từ .env.local
const API_ENDPOINT = 'http://10.0.2.2:8000';

// Định nghĩa các kiểu dữ liệu
type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
};

type EntityErrorPayload = {
  EM: string;
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

// Định nghĩa các lớp lỗi
export class HttpError extends Error {
  status: number;
  payload: {
    EM: string;
    EC?: string;
    [key: string]: any;
  };

  constructor({ status, payload }: { status: number; payload: { EM: string; EC?: string; [key: string]: any } }) {
    super(payload?.EM || 'Lỗi HTTP');
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: 422;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload
  }: {
    status: 422;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload });
    this.status = status;
    this.payload = payload;
  }
}

// Hàm kiểm tra token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('sessionToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Hàm xử lý request
const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }
  
  const baseHeaders: {
    [key: string]: string;
  } = body instanceof FormData
    ? {}
    : {
        'Content-Type': 'application/json'
      };
  
  // Lấy token từ AsyncStorage
  const sessionToken = await getAuthToken();
  if (sessionToken) {
    baseHeaders.Authorization = `Bearer ${sessionToken}`;
  }
  
  // Xử lý baseUrl
  const baseUrl = options?.baseUrl === undefined
    ? API_ENDPOINT
    : options.baseUrl;

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...baseHeaders,
        ...options?.headers
      } as any,
      body,
      method
    });

    const payload: Response = await res.json();
    const data = {
      status: res.status,
      payload
    };

    // Xử lý lỗi
    if (!res.ok) {
      if (res.status === ENTITY_ERROR_STATUS) {
        throw new EntityError(
          data as {
            status: 422;
            payload: EntityErrorPayload;
          }
        );
      } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
        // Xử lý lỗi xác thực trong React Native
        await AsyncStorage.removeItem('sessionToken');
        await AsyncStorage.removeItem('sessionTokenExpiresAt');
        
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại',
          [{ text: 'OK' }]
        );
        
        // Ở đây bạn có thể thêm logic để chuyển hướng người dùng đến màn hình đăng nhập
        // Ví dụ: navigation.navigate('Login');
      } else {
        throw new HttpError({
          status: data.status,
          payload: {
            EM: (data.payload as any).EM || 'Unknown error',
            EC: (data.payload as any).EC,
            ...data.payload
          }
        });
      }
    }

    // Xử lý lưu token khi đăng nhập/đăng ký thành công
    if (['api/login', 'api/register'].some(item => item === normalizePath(url))) {
      const { access_token, expiresAt } = (payload as any).DT;
      await AsyncStorage.setItem('sessionToken', access_token);
      await AsyncStorage.setItem('sessionTokenExpiresAt', expiresAt);
    } else if ('auth/logout' === normalizePath(url)) {
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('sessionTokenExpiresAt');
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Xử lý lỗi mạng
    throw new HttpError({
      status: 0,
      payload: {
        EM: 'Network error',
        error
      }
    });
  }
};

// Đối tượng http với các phương thức
const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('GET', url, options);
  },
  post<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('POST', url, { ...options, body });
  },
  put<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('PUT', url, { ...options, body });
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('DELETE', url, { ...options });
  }
};

export default http;