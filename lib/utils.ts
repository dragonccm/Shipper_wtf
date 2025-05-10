import { Alert } from 'react-native';

export class EntityError extends Error {
  status: 422;
  payload: {
    EM: string;
    errors: {
      field: string;
      message: string;
    }[];
  };
  
  constructor(payload: {
    EM: string;
    errors: {
      field: string;
      message: string;
    }[];
  }) {
    super(payload.EM);
    this.name = "EntityError";
    this.status = 422;
    this.payload = payload;
  }
}

export const handleErrorApi = ({
  error,
  setError,
}: {
  error: any;
  setError?: any;
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: 'server',
        message: item.message
      });
    });
  } else {
    Alert.alert(
      'Lỗi',
      error?.payload?.EM ?? 'Lỗi không xác định',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Xóa đi ký tự `/` đầu tiên của path
 */
export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path;
};

// Hàm format giá tiền theo định dạng tiền Việt Nam
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

// Kiểm tra chuỗi có phải là base64 image không
export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
}

// Format chuỗi ngày tháng
export function formatDateString(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(undefined, options);

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${time} - ${formattedDate}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

