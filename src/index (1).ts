// Core Entity Types

export interface OrgEntity {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  photoUrls: string[];
  createdBy: string;
  createdAt: Date;
  keywords: string[];
}

export interface ProjectEntity {
  id: string;
  name: string;
  description: string | null;
  photos: string[];
  orgId: string;
  clientId: string | null;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  keywords: string[];
  userIds: string[];
}

export type UserRole = 'promoter' | 'supervisor' | 'sitecheck' | 'admin';

export interface UserProfile {
  id: string;
  code: string;
  email: string;
  enable: boolean;
  orgIds: string[];
  lastOrgId: string | null;
  projectIds: string[];
  locationIds: string[];
  displayName: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  trainedAt: Date | null;
  appraisalPoints: number;
  keywords: string[];
  tags: string[];
  groups: string[];
  members: string[];
  role: UserRole;
  policies: string[];
  lineManager: string | null;
  lastSignInAt: Date | null;
  createdAt: Date;
}

export type LocationStatus = 'closed' | 'sitecheck' | 'accepted' | 'denied';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LocationEntity {
  id: string;
  name: string;
  code: string;
  status: LocationStatus;
  orgId: string;
  projectId: string | null;
  level: number;
  parentId: string | null;
  type: string | null;
  tier: string | null;
  ownerName: string | null;
  ownerPhoneNumber: string | null;
  saleName: string | null;
  salePhoneNumber: string | null;
  saleTitle: string | null;
  address: string | null;
  thoroughfare: string | null;
  locality: string | null;
  administrativeArea: string | null;
  postalCode: string | null;
  country: string;
  countryCode: string;
  geoPoint: GeoPoint | null;
  photos: string[];
  isInSession: boolean;
  lastCheckInAt: Date | null;
  lastCheckOutAt: Date | null;
  lastWorkingSessionId: string | null;
  availableStock: boolean;
  tags: string[];
  keywords: string[];
  userIds: string[];
  projectIds: string[];
  updatedAt: Date | null;
  createdAt: Date;
  updatedBy: string | null;
  createdBy: string;
}

export type AssetType = 'product' | 'premium' | 'sampling' | 'other';

export interface AssetEntity {
  id: string;
  orgId: string;
  projectId: string;
  available: boolean;
  clientName: string | null;
  clientId: string | null;
  name: string;
  type: AssetType;
  sku: string;
  category: string | null;
  brandFamilyCode: string | null;
  unit: string;
  pack: string;
  bundle: string;
  unitPerBundle: number;
  unitPerPack: number;
  unitPrice: number;
  bundlePrice: number;
  packPrice: number;
  description: string | null;
  tags: string[];
  photos: string[];
  packLength: number;
  packWidth: number;
  packHeight: number;
  packWeight: number;
  mfgDate: Date | null;
  expDate: Date | null;
  updatedAt: Date | null;
  createdAt: Date;
  createdBy: string;
  keywords: string[];
}

// Operational Entity Types

export interface SessionEntity {
  id: string;
  orgId: string;
  projectId: string;
  locationName: string;
  locationId: string;
  locationGeoPoint: GeoPoint;
  checkInGeoPoint: GeoPoint;
  checkInAddress: string | null;
  checkInProvince: string | null;
  checkInPhotos: string[];
  checkInAt: Date | null;
  checkOutGeoPoint: GeoPoint | null;
  checkOutAddress: string | null;
  checkOutProvince: string | null;
  checkOutPhotos: string[];
  checkOutAt: Date | null;
  durationInMinutes: number | null;
  distanceBetweenLocationIn: number | null;
  distanceBetweenLocationOut: number | null;
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date;
  keywords: string[];
}

export interface SaleItemBuyProduct {
  assetId: string;
  assetName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleItemGetPremium {
  assetId: string;
  assetName: string;
  sku: string;
  quantity: number;
  promotionSchemeId: string | null;
  promotionSchemeName: string | null;
}

export interface Sale {
  id: string;
  projectId: string;
  buyerId: string | null;
  otpCode: string | null;
  buyProducts: SaleItemBuyProduct[];
  getPremiums: SaleItemGetPremium[];
  totalAmount: number;
  totalQuantity: number;
  photos: string[];
  billPhotos: string[];
  notes: string | null;
  locationId: string | null;
  locationName: string | null;
  sessionId: string | null;
  updatedAt: Date | null;
  createdAt: Date;
  keywords: string[];
  createdBy: string;
  createdByName: string | null;
}

export type PromotionMechanism = 'instant' | 'accumulative' | 'tiered';

export interface PromotionReward {
  type: 'premium' | 'discount' | 'cashback';
  assetId: string | null;
  assetName: string | null;
  sku: string | null;
  quantity: number | null;
  value: number | null;
}

export interface PromotionScheme {
  id: string;
  projectId: string;
  name: string;
  code: string;
  mechanism: PromotionMechanism;
  minQuantity: number | null;
  minAmount: number | null;
  rewards: PromotionReward[];
  maxSplittedBills: number | null;
  splitBillsByPrice: boolean | null;
  budgetCap: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  enable: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: string;
}

export interface ScheduleEntity {
  id: string;
  projectId: string;
  locationId: string;
  locationName: string;
  members: string[];
  startAt: Date;
  endAt: Date;
  notes: string | null;
  active: boolean;
  keywords: string[];
  updatedAt: Date | null;
  createdAt: Date;
}

export interface KPITarget {
  id: string;
  projectId: string;
  locationType: string;
  locationKPI: number;
  sessionKPI: number;
  saleVolumeKPI: number;
  period: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  createdAt: Date;
}

// Configuration Types

export interface DemoConfig {
  org: {
    name: string;
    code: string;
    description: string;
  };
  project: {
    name: string;
    description: string;
    tags: string[];
  };
  users: {
    promoter: number;
    supervisor: number;
    sitecheck: number;
    admin: number;
  };
  locations: Array<{
    region: string;
    quantity: number;
    provinces: string[];
  }>;
  assets: {
    products: Array<{
      name: string;
      sku: string;
      category: string;
      unitPrice: number;
      unitPerPack: number;
    }>;
    premiums: Array<{
      name: string;
      sku: string;
      category: string;
    }>;
  };
  promotionSchemes: Array<{
    name: string;
    code: string;
    type: string;
    mechanism: PromotionMechanism;
    productCondition: {
      minQuantity: number;
      minAmount: number;
    };
    rewards: Array<{
      type: string;
      premiumSku: string;
      quantity: number;
    }>;
    accumulativeCondition?: {
      requiredPurchases: number;
      resetPeriodDays: number;
    };
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
    workingHours: {
      start: number;
      end: number;
    };
    workingDays: number[];
  };
  sessions: {
    perUserMin: number;
    perUserMax: number;
    durationMinMinutes: number;
    durationMaxMinutes: number;
    checkInDistanceMaxMeters: number;
    checkOutDistanceMaxMeters: number;
  };
  sales: {
    perSessionMin: number;
    perSessionMax: number;
    productQuantityMin: number;
    productQuantityMax: number;
    promotionRedemptionRate: number;
  };
  kpiTargets: {
    [locationType: string]: {
      locationKPI: number;
      sessionKPI: number;
      saleVolumeKPI: number;
    };
  };
}

// Generated Data Container

export interface GeneratedData {
  org: OrgEntity;
  project: ProjectEntity;
  users: UserProfile[];
  locations: LocationEntity[];
  assets: AssetEntity[];
  promotionSchemes: PromotionScheme[];
  sessions: SessionEntity[];
  sales: Sale[];
  schedules: ScheduleEntity[];
  kpiTargets: KPITarget[];
}

