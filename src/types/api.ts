// src/types/api.ts

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
}

// Backend-compatible paginated response types
export interface IPageBlogVo {
  size: number;
  total: number;
  records: BlogVo[];
  current: number;
  pages: number;
}

export interface ResultIPageBlogVo {
  code: number;
  message: string;
  data: IPageBlogVo;
  timestamp?: number;
}

export interface IPageVipOrder {
  size: number;
  total: number;
  records: VipOrder[];
  current: number;
  pages: number;
}

export interface ResultIPageVipOrder {
  code: number;
  message: string;
  data: IPageVipOrder;
  timestamp?: number;
}

export interface ResultListVipType {
  code: number;
  message: string;
  data: VipType[];
  timestamp?: number;
}

export interface IPageCollectAddress {
  size: number;
  total: number;
  records: CollectedAddress[];
  current: number;
  pages: number;
}

export interface ResultIPageCollectAddress {
  code: number;
  message: string;
  data: IPageCollectAddress;
  timestamp?: number;
}

export interface ResultBlogCommentVo {
  code: number;
  message: string;
  data: BlogCommentVo;
  timestamp?: number;
}

export interface ResultLocalDateTime {
  code: number;
  message: string;
  data: string; // ISO date string
  timestamp?: number;
}

export interface ResultListUsers {
  code: number;
  message: string;
  data: User[];
  timestamp?: number;
}

export interface IPageUsers {
  size: number;
  total: number;
  records: User[];
  current: number;
  pages: number;
}

export interface ResultIPageUsers {
  code: number;
  message: string;
  data: IPageUsers;
  timestamp?: number;
}

// Specific API response types
export interface User {
  userId?: number;
  nickname?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  role?: string;
  isDeleted?: boolean;
  imageurl?: string;
  firebaseUid?: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

export interface UserDto {
  nickname: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  imageurl?: string;
}

// Backend response wrapper types
export interface ResultString {
  code: number;
  message: string;
  data: string;
  timestamp?: number;
}

export interface ResultUsers {
  code: number;
  message: string;
  data: User;
  timestamp?: number;
}

export interface ResultBoolean {
  code: number;
  message: string;
  data: boolean;
  timestamp?: number;
}

export interface ResultMapStringObject {
  code: number;
  message: string;
  data: Record<string, unknown>;
  timestamp?: number;
}

// Backwards compatibility alias
export type UserInfo = User;

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderNo?: string;
  sessionId?: string;
  errorMessage?: string;
  errorCode?: string;
}

export interface VipOrder {
  vipTypeId?: number;
  orderNo?: string;
  amount?: number;
  status?: number;
  payType?: number;
  startTime?: string;
  endTime?: string;
}

export interface VipType {
  id?: number;
  typeCode?: string;
  typeName?: string;
  price?: number;
  durationDays?: number;
  status?: number;
}

export interface BlogVo {
  blId?: number;
  userId?: number;
  // Separated fields
  title: string;        
  excerpt?: string;
  content: string;      
  tags?: string[];
  category?: string;
  isPublished?: boolean;
  slug?: string;
  // Existing fields
  like?: number;
  play?: number;
  imageUrl?: Array<{ imgUrl: string }>;
  videoUrl?: Array<{ viUrl: string }>;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    nickname: string;
    avatar: string;
  };
}

export interface BlogDto {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  isPublished?: boolean;
  imageUrl?: Array<{ imgUrl: string }>;
  videoUrl?: Array<{ viUrl: string }>;
}

export interface BlogCommentVo extends BlogVo {
  comment?: Array<Comment>;
}

export interface Comment {
  userId?: number;
  content: string;
  replyToCommentId?: number;
  isDeleted?: boolean;
}

export interface ResultListString {
  code: number;
  message: string;
  data: string[];
  timestamp?: number;
}

export interface Image {
  imgUrl: string;
  imgSize?: number;
  isDeleted?: boolean;
}

export interface Video {
  viUrl?: string;
  viSize?: number;
  viDuration?: number;
  isDeleted?: boolean;
}

// BlogPost is the generic/local type, kept for compatibility with other files if needed,
// though ideally this should align with BlogVo eventually.
export interface BlogPost {
  blId?: number;
  userId?: number;
  title?: string;
  content?: string;
  blText?: string; // Kept as optional legacy
  like?: number;
  play?: number;
  imageUrl?: Array<{ imgUrl: string }>;
  videoUrl?: Array<{ viUrl: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationInfo {
  city: string;
  country: string;
  address: string;
}

export interface WeatherInfo {
  city: string;
  weather: string;
  temperature: number;
  humidity: number;
  forecast: WeatherDay[];
}

export interface WeatherDay {
  date: string;
  weather: string;
  temperature: { high: number; low: number };
}

export interface WeatherForecast {
  forecasts: Array<WeatherDay>;
}

export interface CollectedAddress {
  id?: number;
  caName?: string;
  latitude?: number;
  longitude?: number;
  userId?: number;
  createdAt?: string;
}

export interface NationInfo {
  id?: number;
  nation?: string;
  code?: string;
  createdAt?: string;
}