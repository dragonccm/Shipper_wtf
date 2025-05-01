# Hướng dẫn sử dụng CustomMapView với OpenStreetMap

## Giới thiệu

Component `CustomMapView` là một wrapper cho thư viện `react-native-maps` với tích hợp OpenStreetMap. Component này cung cấp một giao diện bản đồ chuyên nghiệp và miễn phí, không phụ thuộc vào Google Maps API.

## Cài đặt

Để sử dụng component này, bạn cần cài đặt các thư viện sau:

```bash
npm install react-native-maps react-native-maps-osmdroid
```

Sau đó, cập nhật file `app.json` để thêm quyền truy cập vị trí:

```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION"
],
"plugins": [
  // Các plugin khác
  [
    "expo-location",
    {
      "locationAlwaysAndWhenInUsePermission": "Cho phép ứng dụng sử dụng vị trí của bạn."
    }
  ]
]
```

## Cách sử dụng

```jsx
import { CustomMapView } from "@/components/MapView";

export default function MapScreen() {
  return (
    <CustomMapView
      currentLocation={{
        latitude: 10.762622,
        longitude: 106.660172,
      }}
      destinationLocation={{
        latitude: 10.773831,
        longitude: 106.704895,
      }}
      showRoute={true}
      height={400}
      zoomLevel={14}
    />
  );
}
```

## Props

- `currentLocation`: Vị trí hiện tại (kiểu `Location`)
- `destinationLocation`: Vị trí đích đến (kiểu `Location`)
- `showRoute`: Hiển thị đường đi giữa hai điểm (boolean, mặc định: false)
- `height`: Chiều cao của bản đồ (number, mặc định: 300)
- `zoomLevel`: Mức độ zoom của bản đồ (number, mặc định: 15)

## Kiểu dữ liệu

```typescript
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}
```

## Tính năng

- Tự động chọn provider phù hợp với từng nền tảng (PROVIDER_OSMDROID cho Android, PROVIDER_DEFAULT cho iOS)
- Hiển thị vị trí người dùng
- Hiển thị nút định vị
- Hiển thị la bàn và thước tỷ lệ
- Hỗ trợ zoom và xoay bản đồ
- Tính toán tỷ lệ zoom tự động dựa trên mức zoom được cung cấp

## Lưu ý

- Đảm bảo rằng ứng dụng có quyền truy cập vị trí của người dùng khi sử dụng tính năng `showsUserLocation`
- Trên iOS, component sẽ sử dụng Apple Maps mặc định
- Trên Android, component sẽ sử dụng OpenStreetMap thông qua PROVIDER_OSMDROID

## Tùy chỉnh nâng cao

Trong tương lai, component này có thể được mở rộng để hỗ trợ:

- Vẽ đường đi (Polyline) giữa các điểm
- Tùy chỉnh marker
- Thêm các điểm dừng trung gian
- Tính toán khoảng cách và thời gian di chuyển