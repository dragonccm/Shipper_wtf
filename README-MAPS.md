# Hướng dẫn cài đặt và sử dụng expo-maps

## Cài đặt

Thư viện expo-maps đã được cài đặt thành công trong dự án. Thư viện này cung cấp một giao diện thống nhất cho cả Google Maps và Apple Maps, giúp ứng dụng có thể hiển thị bản đồ trên cả hai nền tảng iOS và Android.

## Cấu hình API Key

Để sử dụng expo-maps, bạn cần phải cấu hình API key cho Google Maps (cho cả iOS và Android). Các API key đã được thêm vào file `app.json` nhưng bạn cần thay thế các giá trị mẫu bằng API key thực của bạn:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.wtfshop.rork",
  "config": {
    "googleMapsApiKey": "YOUR_IOS_GOOGLE_MAPS_API_KEY"
  }
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#ffffff"
  },
  "package": "com.wtfshop.rork",
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

### Cách lấy Google Maps API Key

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một dự án mới hoặc chọn dự án hiện có
3. Kích hoạt Maps SDK cho iOS và Android
4. Tạo API key và cấu hình giới hạn sử dụng (nên giới hạn theo gói ứng dụng và chứng chỉ)
5. Sao chép API key và thay thế vào file `app.json`

## Sử dụng MapView

Component `MapView` đã được cập nhật để sử dụng expo-maps. Dưới đây là cách sử dụng:

```jsx
import { MapView } from "@/components/MapView";

// Trong component của bạn
<MapView
  currentLocation={{
    latitude: 10.7769,
    longitude: 106.7009
  }}
  destinationLocation={{
    latitude: 10.7800,
    longitude: 106.7050
  }}
  showRoute={true}
  height={400}
/>
```

### Props

- `currentLocation`: Vị trí hiện tại (kiểu `Location`)
- `destinationLocation`: Vị trí đích đến (kiểu `Location`)
- `showRoute`: Hiển thị đường đi (boolean, mặc định: false)
- `height`: Chiều cao của bản đồ (number, mặc định: 300)

## Tính năng

- Hiển thị bản đồ với vị trí hiện tại
- Đánh dấu vị trí hiện tại và điểm đến
- Hỗ trợ hiển thị nút định vị người dùng
- Tự động điều chỉnh vùng hiển thị dựa trên vị trí hiện tại

## Lưu ý

- Đảm bảo rằng ứng dụng có quyền truy cập vị trí của người dùng khi sử dụng tính năng `showsUserLocation`
- API key cần được bảo vệ và không nên chia sẻ công khai
- Nên cấu hình giới hạn sử dụng API key để tránh chi phí không mong muốn