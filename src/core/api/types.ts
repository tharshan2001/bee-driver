export interface LoginResponse {
  token: string;
  refreshToken: string;
  driverId: string;
  availability: boolean;
  mustChangePassword?: boolean;
}

export interface DriverDashboard {
  activeDeliveries: number;
  completedToday: number;
  failedToday: number;
  recentDeliveries: DeliverySummary[];
  driverName: string;
  availability: boolean;
}

export interface DeliverySummary {
  orderId: string;
  orderNumber: string;
  customerName: string;
  district?: string;
  status: string;
  createdAt: string;
}

export interface DriverDelivery {
  orderId: string;
  orderNumber: string;
  customer: CustomerInfo;
  orderInfo: OrderInfo;
  items: DeliveryItem[];
  status: string;
  scheduledDate?: string;
  timeline: StatusTimeline[];
  photoUrl?: string;
  signatureUrl?: string;
  driverNotes?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  district?: string;
}

export interface OrderInfo {
  orderNumber: string;
  total: number;
  paid: number;
  outstanding: number;
  paymentStatus: string;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  productItemCode: string | null;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  name: string;
}

export interface StatusTimeline {
  status: string;
  timestamp: string;
  note?: string;
}

export interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  licenseNumber?: string;
  photoUrl?: string;
  memberSince: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface DriverStats {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  totalEarnings: number;
  rating?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
