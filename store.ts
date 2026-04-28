import { useState, useCallback, useEffect, useMemo } from 'react';
import { auth, db, isMockMode, firebaseConfig } from './lib/firebase.ts';
const logoImg = '/assets/logo.png';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  increment,
  where,
  getDocFromServer,
  onSnapshot,
  Timestamp,
  or
} from 'firebase/firestore';

// =========================================================
// FIRESTORE ERROR HANDLING
// =========================================================
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  const jsonError = JSON.stringify(errInfo);
  console.error('[Firestore Error Details]:', jsonError);
  
  // Only throw if it's a critical permission error that we want the system to catch
  if (errInfo.error.includes('permission-denied') || errInfo.error.includes('insufficient permissions')) {
    throw new Error(jsonError);
  }
}
import {
  User,
  AttendanceRecord,
  FirstTimer,
  Asset,
  Complaint,
  FollowUpReminder,
  Absentee,
  Announcement,
  IdentityRole,
  WorkerPermission,
  Member,
  Gender,
  Resource,
  LandingPageConfig,
  SermonAccessLevel,
  PrayerNote,
  PrayerRequest,
  ChurchEvent,
  Group,
  Broadcast,
  Order,
  Donation,
  Review,
  Book,
  BookstoreConfig,
  PaymentConfig
} from './types.ts';
import { ASSET_CATEGORIES } from './constants.tsx';
import {
  mockAttendance,
  mockFirstTimers,
  mockAssets,
  mockUsers,
  mockAbsentees,
  mockAnnouncements,
  mockComplaints,
  mockResources,
  mockMembers,
  mockEvents,
  mockReminders
} from './mockData.ts';

export interface SystemActivity {
  id: string;
  type: 'SECURITY' | 'ATTENDANCE' | 'VISITOR' | 'SYSTEM' | 'MEMBER';
  details: string;
  timestamp: string;
  user: string;
}

// =========================================================
// GOOGLE / DRIVE HELPERS
// =========================================================
export type GoogleResourceKind =
  | 'drive-file'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'form'
  | 'audio'
  | 'video'
  | 'image'
  | 'unknown';

const GOOGLE_HOSTS = ['drive.google.com', 'docs.google.com'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'webm'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

export const isDriveLink = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return GOOGLE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

export const extractGoogleFileId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    const idParam = parsed.searchParams.get('id');
    if (idParam) return idParam;
    const match = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match?.[1]) return match[1];
    const fileMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch?.[1]) return fileMatch[1];
    const ucMatch = parsed.pathname.match(/\/uc\?id=([a-zA-Z0-9_-]+)/);
    if (ucMatch?.[1]) return ucMatch[1];
    return null;
  } catch {
    const regexes = [
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/uc\?id=([a-zA-Z0-9_-]+)/
    ];
    for (const regex of regexes) {
      const match = url.match(regex);
      if (match?.[1]) return match[1];
    }
    return null;
  }
};

export const getFileExtension = (url: string): string => {
  const lower = (url || '').toLowerCase();
  const match = lower.match(/\.([a-z0-9]+)(?:\?|$)/);
  return match ? match[1] : '';
};

export const getGoogleResourceKind = (url: string): GoogleResourceKind => {
  if (!url || typeof url !== 'string') return 'unknown';
  try {
    const parsed = new URL(url.trim());
    const path = parsed.pathname;
    const ext = getFileExtension(url);
    if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (parsed.hostname === 'drive.google.com') {
      if (path.includes('/file/d/') || path.includes('/uc') || path.includes('/open')) {
        return 'drive-file';
      }
    }
    if (parsed.hostname === 'docs.google.com') {
      if (path.includes('/document/d/')) return 'document';
      if (path.includes('/spreadsheets/d/')) return 'spreadsheet';
      if (path.includes('/presentation/d/')) return 'presentation';
      if (path.includes('/forms/d/')) return 'form';
      if (path.includes('/uc')) return 'drive-file';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

export const getDriveDirectLink = (
  url: string,
  intent: 'download' | 'view' | 'stream' = 'download'
): string => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (!isDriveLink(cleanUrl)) return cleanUrl;
  const id = extractGoogleFileId(cleanUrl);
  const kind = getGoogleResourceKind(cleanUrl);
  if (!id) return cleanUrl;
  switch (kind) {
    case 'drive-file':
    case 'audio':
    case 'video':
    case 'image':
      return intent === 'download'
        ? `https://drive.google.com/uc?export=download&id=${id}`
        : intent === 'stream'
        ? `https://drive.google.com/uc?export=download&id=${id}`
        : `https://drive.google.com/uc?export=view&id=${id}`;
    case 'document':
      return intent === 'download'
        ? `https://docs.google.com/document/d/${id}/export?format=docx`
        : `https://docs.google.com/document/d/${id}/preview`;
    case 'spreadsheet':
      return intent === 'download'
        ? `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`
        : `https://docs.google.com/spreadsheets/d/${id}/preview`;
    case 'presentation':
      return intent === 'download'
        ? `https://docs.google.com/presentation/d/${id}/export/pptx`
        : `https://docs.google.com/presentation/d/${id}/preview`;
    case 'form':
      return cleanUrl;
    default:
      return intent === 'download'
        ? `https://drive.google.com/uc?export=download&id=${id}`
        : `https://drive.google.com/uc?export=view&id=${id}`;
  }
};

export const getPlayableMediaUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (!isDriveLink(cleanUrl)) return cleanUrl;
  const id = extractGoogleFileId(cleanUrl);
  const kind = getGoogleResourceKind(cleanUrl);
  if (!id) return cleanUrl;
  if (kind === 'drive-file' || kind === 'audio' || kind === 'video') {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return cleanUrl;
};

export const getPreviewUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (!isDriveLink(cleanUrl)) return cleanUrl;
  const id = extractGoogleFileId(cleanUrl);
  const kind = getGoogleResourceKind(cleanUrl);
  if (!id) return cleanUrl;
  switch (kind) {
    case 'drive-file':
    case 'audio':
    case 'video':
    case 'image':
      return `https://drive.google.com/file/d/${id}/preview`;
    case 'document':
      return `https://docs.google.com/document/d/${id}/preview`;
    case 'spreadsheet':
      return `https://docs.google.com/spreadsheets/d/${id}/preview`;
    case 'presentation':
      return `https://docs.google.com/presentation/d/${id}/preview`;
    default:
      return cleanUrl;
  }
};

export const getEmbedUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (!isDriveLink(cleanUrl)) return cleanUrl;
  const id = extractGoogleFileId(cleanUrl);
  const kind = getGoogleResourceKind(cleanUrl);
  if (!id) return cleanUrl;
  switch (kind) {
    case 'drive-file':
    case 'audio':
    case 'video':
    case 'image':
      return `https://drive.google.com/file/d/${id}/preview`;
    case 'document':
      return `https://docs.google.com/document/d/${id}/preview`;
    case 'spreadsheet':
      return `https://docs.google.com/spreadsheets/d/${id}/preview`;
    case 'presentation':
      return `https://docs.google.com/presentation/d/${id}/preview`;
    default:
      return `https://drive.google.com/file/d/${id}/preview`;
  }
};

export const getSuggestedExtensionFromUrl = (url: string): string => {
  const lower = (url || '').toLowerCase();
  const kind = getGoogleResourceKind(url);
  if (kind === 'audio') {
    const ext = getFileExtension(url);
    return ext ? `.${ext}` : '.mp3';
  }
  if (kind === 'video') {
    const ext = getFileExtension(url);
    return ext ? `.${ext}` : '.mp4';
  }
  if (lower.includes('/document/d/') || lower.includes('format=docx')) return '.docx';
  if (lower.includes('/spreadsheets/d/') || lower.includes('format=xlsx')) return '.xlsx';
  if (lower.includes('/presentation/d/') || lower.includes('/export/pptx')) return '.pptx';
  if (lower.endsWith('.pdf')) return '.pdf';
  if (lower.endsWith('.mp3')) return '.mp3';
  if (lower.endsWith('.wav')) return '.wav';
  if (lower.endsWith('.m4a')) return '.m4a';
  if (lower.endsWith('.aac')) return '.aac';
  if (lower.endsWith('.ogg')) return '.ogg';
  if (lower.endsWith('.mp4')) return '.mp4';
  if (lower.endsWith('.webm')) return '.webm';
  return '';
};

export const sanitizeDownloadFileName = (name: string, ext = ''): string => {
  const cleaned = (name || 'download')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!ext) return cleaned || 'download';
  const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
  return cleaned.toLowerCase().endsWith(cleanExt.toLowerCase())
    ? cleaned
    : `${cleaned}${cleanExt}`;
};

export const forceBrowserDownload = async (
  url: string,
  filename?: string
): Promise<void> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      mode: 'cors'
    });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      return;
    }
  } catch (error) {
    console.warn('Fetch download failed, trying fallback:', error);
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || '';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const resolveDownloadInfo = (
  url: string,
  title?: string
): { url: string; filename: string } => {
  const directUrl = getDriveDirectLink(url, 'download');
  const ext = getSuggestedExtensionFromUrl(url);
  const filename = sanitizeDownloadFileName(title || 'download', ext);
  return {
    url: directUrl,
    filename
  };
};

export const resourceSupportsInlineAudio = (res: Partial<Resource>): boolean => {
  const category = (res.category || '').toLowerCase();
  const fileUrl = (res.fileUrl || '').toLowerCase();
  const title = (res.title || '').toLowerCase();
  const kind = getGoogleResourceKind(res.fileUrl || '');
  return (
    category === 'sermon' ||
    category === 'music' ||
    kind === 'audio' ||
    AUDIO_EXTENSIONS.some(ext => fileUrl.includes(`.${ext}`)) ||
    AUDIO_EXTENSIONS.some(ext => title.includes(`.${ext}`))
  );
};

export const resourceSupportsInlineVideo = (res: Partial<Resource>): boolean => {
  const fileUrl = (res.fileUrl || '').toLowerCase();
  const kind = getGoogleResourceKind(res.fileUrl || '');
  return (
    kind === 'video' ||
    VIDEO_EXTENSIONS.some(ext => fileUrl.includes(`.${ext}`))
  );
};

export const formatImageUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return '/assets/logo.png';
  const cleanUrl = url.trim();
  if (cleanUrl === '') return '/assets/logo.png';
  if (!isDriveLink(cleanUrl)) return cleanUrl;
  const id = extractGoogleFileId(cleanUrl);
  const kind = getGoogleResourceKind(cleanUrl);
  if (!id) return cleanUrl;
  if (kind === 'image' || kind === 'drive-file') {
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }
  return getPreviewUrl(cleanUrl);
};

export const checkDriveAccessibility = async (url: string): Promise<{
  accessible: boolean;
  message: string;
}> => {
  if (!isDriveLink(url)) {
    return { accessible: true, message: 'External URL' };
  }
  const directUrl = getDriveDirectLink(url, 'view');
  try {
    const response = await fetch(directUrl, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    return {
      accessible: true,
      message: 'File appears accessible'
    };
  } catch (error) {
    return {
      accessible: false,
      message: 'File may not be publicly shared. Please check Google Drive permissions.'
    };
  }
};

export const DEFAULT_SETTINGS = {
  general: {
    churchName: 'Salvation In Jesus Ministry',
    tagline: 'Look Unto Jesus: The Only Name That Saves.',
    email: 'admin@salvationinjesus.org'
  },
  terminology: {
    firstTimerLabel: 'First Timer',
    firstTimerPlural: 'First Timers',
    memberLabel: 'Member',
    memberPlural: 'Members',
    usherLabel: 'Usher',
    usherPlural: 'Ushers',
    serviceLabel: 'Service',
    servicePlural: 'Services',
    resourceLabel: 'Download',
    resourcePlural: 'Downloads'
  },
  uiText: {
    login_welcome: 'Salvation In Jesus Ministry',
    login_subtitle: 'Administrative Portal Access',
    login_footer: `© ${new Date().getFullYear()} SIJM. All rights reserved.`,
    admin_dash_title: 'Ministry Oversight',
    admin_dash_subtitle: 'Real-time metrics and spiritual growth analytics',
    usher_dash_welcome: 'Blessings,',
    usher_dash_cta: 'Immediate Service Tasks',
    attendance_page_title: 'Service Attendance',
    attendance_page_desc: 'Log headcounts for services and special meetings',
    first_timers_page_title: 'Souls Register',
    first_timers_page_desc: 'Track and follow up with new visitors',
    absentees_page_title: 'Pastoral Care',
    absentees_page_desc: 'Monitoring the flock and reaching the missing',
    announcements_page_title: 'Ministry Logistics',
    announcements_page_desc: 'Coordinate requests and announcements',
    assets_page_title: 'Church Assets',
    assets_page_desc: 'Physical resources and stewardship tracking',
    complaints_page_title: 'Facility Reports',
    complaints_page_desc: 'Maintain the house of God with excellence',
    reminders_page_title: 'Follow-up Tasking',
    reminders_page_desc: 'Scheduled interactions for soul winning',
    ushers_page_title: 'Ministry Staff',
    ushers_page_desc: 'Manage ushers and portal security',
    reports_page_title: 'Ministry Intelligence',
    reports_page_desc: 'Strategic reporting and trend analysis',
    members_page_title: 'Member Directory',
    members_page_desc: 'Comprehensive management of the church flock'
  },
  branding: {
    primaryColor: '#002366',
    secondaryColor: '#D4AF37',
    sidebarBg: '#002366',
    sidebarText: '#ffffff',
    sidebarActiveBg: '#D4AF37',
    sidebarActiveText: '#ffffff',
    headerBg: '#ffffff',
    headerText: '#002366',
    pageBg: '#f8fafc',
    cardBg: '#ffffff',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    dangerColor: '#ef4444',
    logoUrl: '/assets/logo.png',
    faviconUrl: '/assets/logo.png',
    borderRadius: '1.5rem',
    glassIntensity: '0.1',
    fontFamily: 'Inter'
  },
  permissions: {
    usherCanSeeAssets: false,
    usherCanSeeAbsentees: true,
    usherCanSeeAnnouncements: true,
    usherCanSeeComplaints: true,
    usherCanSeeReports: false
  },
  ai: {
    divineIntelligenceEnabled: true,
    propheticVisionsEnabled: true,
    aiLogoUrl: '',
    customAiSystemPrompt: 'You are a spiritual administrative assistant for a high-growth ministry.'
  },
  spiritual: {
    scriptures: [
      { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', version: 'KJV' }
    ],
    counselingEmail: 'enochapafloe@gmail.com'
  },
  assetCategories: ASSET_CATEGORIES,
  memberCategories: ['Member', 'Officer', 'Child', 'Teen', 'Youth', 'Elder', 'Pastor', 'Deacon'],
  customTags: ['High Attendance', 'Tithe Faithful', 'Choral', 'Volunteer'],
  serviceTypes: ['Morning Service', 'Evening Service', 'Midweek Service', 'Special Event', 'Youth Service', 'Bible Study'],
  branches: ['Main Branch', 'Lagos Branch', 'Abuja Branch', 'Port Harcourt Branch'],
  attendanceSegments: ['Main Hall', 'Gallery', 'Overflow 1', 'Overflow 2', 'Children Church', 'Teen Church', 'Youth Hall'],
  liveStream: {
    // YouTube Data API v3
    youtubeApiKey:    '',   // AIza...
    youtubeChannelId: '',   // UC...
    // Facebook Graph API
    facebookPageId:   '',   // numeric page ID
    facebookAccessToken: '', // page access token
    // Manual override (if auto-detect is off or API quota exceeded)
    manualOverride:   false,
    manualIsLive:     false,
    manualYoutubeUrl: '',   // full embed URL for manual override
    manualFacebookUrl: '',
    // Active platform shown in app
    preferredPlatform: 'youtube' as 'youtube' | 'facebook' | 'both',
    // Service info shown in app
    serviceType:   'Sunday Service',
    preacher:      '',
    sermonSeries:  '',
    // Features
    chatEnabled:    true,
    prayerEnabled:  true,
    givingEnabled:  true,
    // Push notification text when going live
    notificationTitle: 'We Are Live! 🔴',
    notificationBody:  'SIJM is streaming now. Tap to join the service.',
  }
};

export const DEFAULT_LANDING_PAGE_CONFIG: LandingPageConfig = {
  id: 'main',
  branding: {
    logo: logoImg,
    favicon: logoImg,
    primaryColor: '#002366',
    secondaryColor: '#FFD700',
  },
  hero: {
    title: 'Experience the Power of Faith',
    subtitle: 'Join our community in spreading the light of Christ across the globe.',
    backgroundType: 'image',
    backgroundUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000',
    parallax: true,
    typography: {
      h1Size: 'text-8xl',
      h2Size: 'text-2xl',
      fontFamily: 'Inter',
    },
  },
  sections: [],
  seo: {
    title: 'SIJM - Salvation In Jesus Ministry',
    description: 'Experience the power of faith and join our global community.',
  },
  advanced: {
    customCss: '',
    customJs: '',
  },
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_BOOKSTORE_CONFIG: BookstoreConfig = {
  id: 'main',
  isComingSoon: false,
  categories: ['All', 'Prophetic', 'Spiritual Warfare', 'Devotional', 'Finance & Faith', 'Ministry', 'Inner Healing'],
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  id: 'main',
  stripeEnabled: true,
  paystackEnabled: true,
  currency: 'GHS',
  updatedAt: new Date().toISOString(),
};

export function useCMSStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
  const [absentees, setAbsentees] = useState<Absentee[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [landingPageConfig, setLandingPageConfig] = useState<LandingPageConfig | null>(null);
  const [bookstoreConfig, setBookstoreConfig] = useState<BookstoreConfig | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [connectionVerified, setConnectionVerified] = useState(false);

  // ✅ FIXED: Test Firebase connection on mount
  useEffect(() => {
    async function testConnection() {
      if (isMockMode) {
        setConnectionVerified(true);
        return;
      }
      try {
        // Use the dedicated test path which is publicly readable in firestore.rules
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("✅ Firestore connection verified.");
        setConnectionVerified(true);
      } catch (error: any) {
        // If we get permission-denied, it still means we reached the server
        if (error?.code === 'permission-denied') {
          console.log("✅ Firestore connection verified (via permission check).");
          setConnectionVerified(true);
        } else {
          console.error("❌ Firestore connection test failed:", error);
          setConnectionVerified(false);
        }
      }
    }
    testConnection();
  }, []);

  const logActivity = (details: string, type: SystemActivity['type']) => {
    const newActivity: SystemActivity = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      details,
      timestamp: new Date().toISOString(),
      user: currentUser?.fullName || 'System'
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    if (isMockMode) return;
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      const idTokenResult = await auth.currentUser?.getIdTokenResult();
      const claims = idTokenResult?.claims || {};
      const isHardcodedAdmin = email === 'enochapafloe@gmail.com';
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const permissions = (claims.workerPermissions as WorkerPermission[]) ||
          (data.workerPermissions as WorkerPermission[]) ||
          (data.worker_permissions as WorkerPermission[]) ||
          [];
        if (isHardcodedAdmin && !permissions.includes(WorkerPermission.SUPER_ADMIN)) {
          permissions.push(WorkerPermission.SUPER_ADMIN);
        }
        setCurrentUser({
          id: userId,
          username: data.username || email.split('@')[0],
          fullName: data.full_name || data.fullName || 'Staff Member',
          identityRole:
            (claims.identityRole as IdentityRole) ||
            (data.identityRole as IdentityRole) ||
            (data.identity_role as IdentityRole) ||
            IdentityRole.MEMBER,
          workerPermissions: permissions,
          email,
          phone: data.phone,
          branch: data.branch,
          location: data.location,
          birthday: data.birthday,
          gender: data.gender,
          status: data.status || 'active',
          sermonAccessSuspended: !!(data.sermonAccessSuspended || data.sermon_access_suspended),
          profileUpdateRequested: !!(data.profileUpdateRequested || data.profile_update_requested)
        });
      } else {
        const permissions = (claims.workerPermissions as WorkerPermission[]) || [];
        if (isHardcodedAdmin && !permissions.includes(WorkerPermission.SUPER_ADMIN)) {
          permissions.push(WorkerPermission.SUPER_ADMIN);
        }
        const newP = {
          id: userId,
          full_name: email.split('@')[0],
          fullName: email.split('@')[0],
          identityRole: (claims.identityRole as IdentityRole) || IdentityRole.MEMBER,
          identity_role: (claims.identityRole as IdentityRole) || IdentityRole.MEMBER,
          workerPermissions: permissions,
          worker_permissions: permissions,
          status: 'active',
          username: email.split('@')[0],
          email,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newP);
        setCurrentUser({
          id: userId,
          username: newP.username,
          fullName: newP.fullName,
          identityRole: newP.identityRole,
          workerPermissions: newP.workerPermissions,
          email,
          status: 'active',
          profileUpdateRequested: false
        });
      }
    } catch (e) {
      console.error('Profile handshake failed', e);
    }
  }, []);

  const isMediaTeam = useMemo(() => currentUser?.workerPermissions?.some(p =>
    [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN, WorkerPermission.MEDIA_TEAM].includes(p as WorkerPermission)
  ), [currentUser]);

  const isLeadership = useMemo(() => 
    isMediaTeam || 
    [
      IdentityRole.PASTOR, IdentityRole.APOSTLE, IdentityRole.PROPHET, 
      IdentityRole.TEACHER, IdentityRole.EVANGELIST, IdentityRole.LEADER,
      IdentityRole.GROUP_HEAD, IdentityRole.BRANCH_HEAD, IdentityRole.REGIONAL_HEAD,
      IdentityRole.NATIONAL_HEAD, IdentityRole.GENERAL_HEAD
    ].includes(currentUser?.identityRole as IdentityRole)
  , [currentUser, isMediaTeam]);

  const isUsher = useMemo(() => isMediaTeam || isLeadership || currentUser?.workerPermissions?.some(p =>
    [WorkerPermission.USHER].includes(p as WorkerPermission)
  ), [currentUser, isMediaTeam, isLeadership]);
  
  const isSuperAdmin = useMemo(() => currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN), [currentUser]);

  const isMember = useMemo(() => 
    currentUser?.identityRole === IdentityRole.MEMBER || isLeadership
  , [currentUser, isLeadership]);

  const isPrayerHead = useMemo(() => 
    currentUser?.workerPermissions?.some(p => 
      [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN, WorkerPermission.PRAYER_HEAD].includes(p as WorkerPermission)
    )
  , [currentUser]);

  const isPrayerTeam = useMemo(() => 
    currentUser?.workerPermissions?.some(p => 
      [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN, WorkerPermission.PRAYER_TEAM, WorkerPermission.PRAYER_HEAD].includes(p as WorkerPermission)
    ) || isLeadership
  , [currentUser, isLeadership]);

  // ✅ FIXED: Granular real-time subscriptions with proper cleanup
  // 1. Public/Global Data (Always subscribe)
  useEffect(() => {
    if (isMockMode) {
      setLandingPageConfig(DEFAULT_LANDING_PAGE_CONFIG);
      setBookstoreConfig(DEFAULT_BOOKSTORE_CONFIG);
      setPaymentConfig(DEFAULT_PAYMENT_CONFIG);
      setEvents(mockEvents || []); // Fallback to empty if not defined
      setAnnouncements(mockAnnouncements);
      return;
    }

    const unsubs: (() => void)[] = [];

    // Announcements
    unsubs.push(onSnapshot(collection(db, 'announcements'), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => {
        const an = doc.data() as any;
        return {
          id: doc.id,
          ...an,
          createdAt: an.created_at || an.createdAt || new Date().toISOString(),
          submittedBy: an.submitted_by || an.submittedBy || 'Staff'
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'announcements')));

    // Events
    unsubs.push(onSnapshot(collection(db, 'events'), (snapshot) => {
      setEvents(snapshot.docs.map(doc => {
        const e = doc.data() as any;
        return {
          id: doc.id,
          ...e,
          isRecurring: !!(e.is_recurring || e.isRecurring),
          recurringDay: e.recurring_day || e.recurringDay,
          createdAt: e.created_at || e.createdAt
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as ChurchEvent[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events')));

    // Groups
    unsubs.push(onSnapshot(collection(db, 'groups'), (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'groups')));

    // Landing Page Config
    unsubs.push(onSnapshot(doc(db, 'landingPageConfigs', 'main'), (doc) => {
      if (doc.exists()) {
        setLandingPageConfig(doc.data() as LandingPageConfig);
      } else {
        setLandingPageConfig(DEFAULT_LANDING_PAGE_CONFIG);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'landingPageConfigs/main')));

    // Bookstore Config
    unsubs.push(onSnapshot(doc(db, 'settings', 'bookstore'), (doc) => {
      if (doc.exists()) {
        setBookstoreConfig(doc.data() as BookstoreConfig);
      } else {
        setBookstoreConfig(DEFAULT_BOOKSTORE_CONFIG);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/bookstore')));

    // Payment Config
    unsubs.push(onSnapshot(doc(db, 'settings', 'payment'), (doc) => {
      if (doc.exists()) {
        setPaymentConfig(doc.data() as PaymentConfig);
      } else {
        setPaymentConfig(DEFAULT_PAYMENT_CONFIG);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/payment')));

    // Broadcasts
    unsubs.push(onSnapshot(collection(db, 'broadcasts'), (snapshot) => {
      setBroadcasts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Broadcast)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'broadcasts')));

    // Orders
    unsubs.push(onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders')));

    // Donations
    unsubs.push(onSnapshot(collection(db, 'donations'), (snapshot) => {
      setDonations(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Donation)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'donations')));

    // Reviews
    unsubs.push(onSnapshot(collection(db, 'reviews'), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')));

    // Books
    unsubs.push(onSnapshot(collection(db, 'books'), (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'books')));

    // Settings
    unsubs.push(onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        const sData = doc.data();
        if (sData?.config && typeof sData.config === 'object') {
          const merged = { ...DEFAULT_SETTINGS };
          Object.keys(sData.config).forEach(key => {
            if (
              typeof sData.config[key] === 'object' &&
              sData.config[key] !== null &&
              !Array.isArray(sData.config[key])
            ) {
              merged[key as keyof typeof DEFAULT_SETTINGS] = {
                ...(DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] as any),
                ...sData.config[key]
              };
            } else {
              (merged as any)[key] = sData.config[key];
            }
          });
          setSettings(merged);
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global')));

    return () => unsubs.forEach(unsub => unsub());
  }, [isMockMode]);

  // 2. User-specific Data (Profiles/Users)
  useEffect(() => {
    if (isMockMode || !currentUser || !isUsher) {
      if (isMockMode) setUsers(mockUsers);
      else setUsers([]);
      return;
    }

    return onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => {
        const p = doc.data() as any;
        return {
          id: doc.id,
          username: p.username,
          fullName: p.full_name || p.fullName,
          identityRole: p.identity_role || p.identityRole || IdentityRole.MEMBER,
          workerPermissions: p.worker_permissions || p.workerPermissions || [],
          status: p.status,
          email: p.email,
          phone: p.phone,
          branch: p.branch,
          location: p.location,
          birthday: p.birthday,
          gender: p.gender,
          profileUpdateRequested: !!(p.profile_update_requested || p.profileUpdateRequested),
          sermonAccessSuspended: !!(p.sermon_access_suspended || p.sermonAccessSuspended),
          createdAt: p.created_at || p.createdAt
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'profiles'));
  }, [currentUser, isMockMode, isUsher]);

  // 3. Usher/Admin Data (Members, Attendance, First Timers, Assets, etc.)
  useEffect(() => {
    if (isMockMode || !currentUser || !isUsher) {
      if (isMockMode) {
        setMembers(mockMembers);
        setAttendance(mockAttendance);
        setFirstTimers(mockFirstTimers);
        setAssets(mockAssets);
        setAbsentees(mockAbsentees);
        setComplaints(mockComplaints);
        setReminders(mockReminders || []);
      }
      return;
    }

    const unsubs: (() => void)[] = [];

    // Members
    unsubs.push(onSnapshot(collection(db, 'members'), (snapshot) => {
      setMembers(snapshot.docs.map(doc => {
        const m = doc.data() as any;
        return {
          id: doc.id,
          fullName: m.full_name || m.fullName,
          gender: m.gender,
          birthday: m.birthday,
          phone: m.phone,
          email: m.email,
          location: m.location,
          branch: m.branch,
          category: m.category,
          customTags: m.custom_tags || m.customTags || [],
          parentIds: m.parent_ids || m.parentIds || [],
          childrenIds: m.children_ids || m.childrenIds || [],
          membershipDate: m.membership_date || m.membershipDate,
          followUpNeeded: !!(m.follow_up_needed || m.followUpNeeded),
          profileUpdateRequested: !!(m.profile_update_requested || m.profileUpdateRequested),
          notes: m.notes,
          createdAt: m.created_at || m.createdAt
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'members')));

    // Attendance
    unsubs.push(onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => {
        const a = doc.data() as any;
        return {
          id: doc.id,
          date: a.service_date || a.date,
          serviceType: a.service_type || a.serviceType,
          branch: a.branch || 'Main Branch',
          segmentName: a.segment_name || a.segmentName || 'Main Hall',
          maleCount: a.male_count ?? a.maleCount ?? 0,
          femaleCount: a.female_count ?? a.femaleCount ?? 0,
          childrenCount: a.children_count ?? a.childrenCount ?? 0,
          totalCount: a.total_count ?? a.totalCount ?? 0,
          recordedBy: a.recorded_by || a.recordedBy,
          recordedById: a.recorded_by_id || a.recordedById,
          createdAt: a.created_at || a.createdAt
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'attendance')));

    // First Timers
    unsubs.push(onSnapshot(collection(db, 'first_timers'), (snapshot) => {
      setFirstTimers(snapshot.docs.map(doc => {
        const f = doc.data() as any;
        return {
          id: doc.id,
          fullName: f.full_name || f.fullName,
          phone: f.phone,
          email: f.email,
          gender: f.gender,
          ageGroup: f.age_group || f.ageGroup,
          occupation: f.occupation,
          maritalStatus: f.marital_status || f.maritalStatus,
          prayerRequest: f.prayer_request || f.prayerRequest,
          preferredContactMethod: f.preferred_contact_method || f.preferredContactMethod,
          source: f.source,
          invitedBy: f.invited_by || f.invitedBy,
          visitDate: f.visit_date || f.visitDate,
          followUpStatus: f.follow_up_status || f.followUpStatus,
          location: f.location,
          recordedBy: f.recorded_by || f.recordedBy
        };
      }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'first_timers')));

    // Assets
    unsubs.push(onSnapshot(collection(db, 'assets'), (snapshot) => {
      setAssets(snapshot.docs.map(doc => {
        const as = doc.data() as any;
        return {
          id: as.id,
          name: as.name,
          category: as.category,
          totalQuantity: as.total_quantity ?? as.totalQuantity ?? 0,
          goodCondition: as.good_condition ?? as.goodCondition ?? 0,
          manageable: as.manageable ?? 0,
          discarded: as.discarded ?? 0,
          location: as.location,
          value: Number(as.value || as.totalValue || 0)
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assets')));

    // Absentees
    unsubs.push(onSnapshot(collection(db, 'absentees'), (snapshot) => {
      setAbsentees(snapshot.docs.map(doc => {
        const ab = doc.data() as any;
        return {
          id: doc.id,
          memberName: ab.member_name || ab.memberName,
          phone: ab.phone,
          lastSeenDate: ab.last_seen_date || ab.lastSeenDate,
          dateNoticed: ab.date_noticed || ab.dateNoticed || ab.created_at || ab.createdAt,
          weeksAbsent: ab.weeks_absent ?? ab.weeksAbsent ?? 0,
          priority: ab.priority,
          status: ab.status,
          notes: ab.notes,
          recordedBy: ab.recorded_by || ab.recordedBy
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'absentees')));

    // Complaints
    unsubs.push(onSnapshot(collection(db, 'complaints'), (snapshot) => {
      setComplaints(snapshot.docs.map(doc => {
        const c = doc.data() as any;
        return {
          id: doc.id,
          category: c.category,
          title: c.title,
          description: c.description,
          priority: c.priority,
          status: c.status,
          submittedBy: c.submitted_by || c.submittedBy,
          createdAt: c.created_at || c.createdAt
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'complaints')));

    // Reminders
    unsubs.push(onSnapshot(collection(db, 'reminders'), (snapshot) => {
      setReminders(snapshot.docs.map(doc => {
        const r = doc.data() as any;
        return {
          id: r.id,
          firstTimerId: r.first_timer_id || r.firstTimerId,
          firstTimerName: r.first_timer_name || r.firstTimerName,
          assignedTo: r.assigned_to || r.assignedTo,
          date: r.date,
          time: r.time,
          type: r.type,
          status: r.status,
          notes: r.notes
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reminders')));

    return () => unsubs.forEach(unsub => unsub());
  }, [currentUser, isUsher, isMockMode]);

  // 4. Resources (Sermons)
  useEffect(() => {
    if (isMockMode) {
      setResources(mockResources);
      setIsLoading(false);
      return;
    }

    if (currentUser?.sermonAccessSuspended) {
      setResources([]);
      setIsLoading(false);
      return;
    }

    const resourcesRef = collection(db, 'resources');
    const publicOptions = [SermonAccessLevel.PUBLIC, 'Public', 'public', 'General Public', 'all', 'All', 'any', ''];
    const memberOptions = [SermonAccessLevel.MEMBER, 'Member', 'Member-Only', ...publicOptions.slice(0, 7)];
    const leadershipOptions = [SermonAccessLevel.LEADERSHIP, 'Leadership', 'Leadership-Only', ...memberOptions.slice(0, 7)];

    let resourcesQuery;
    if (isMediaTeam) {
      resourcesQuery = resourcesRef;
    } else if (isLeadership) {
      resourcesQuery = query(resourcesRef, or(where('access_level', 'in', leadershipOptions), where('accessLevel', 'in', leadershipOptions)));
    } else if (isMember) {
      resourcesQuery = query(resourcesRef, or(where('access_level', 'in', memberOptions), where('accessLevel', 'in', memberOptions)));
    } else {
      resourcesQuery = query(resourcesRef, where('access_level', 'in', publicOptions));
    }

    return onSnapshot(resourcesQuery, (snapshot) => {
      const allResources = snapshot.docs.map(doc => {
        const res = doc.data() as any;
        const rawLevel = (res.access_level || res.accessLevel || SermonAccessLevel.PUBLIC).toLowerCase();
        let mappedLevel = SermonAccessLevel.PUBLIC;
        if (rawLevel.includes('member')) mappedLevel = SermonAccessLevel.MEMBER;
        else if (rawLevel.includes('leadership')) mappedLevel = SermonAccessLevel.LEADERSHIP;

        return {
          id: doc.id,
          title: res.title,
          description: res.description,
          category: res.category,
          fileUrl: res.file_url || res.fileUrl,
          thumbnailUrl: res.thumbnail_url || res.thumbnailUrl,
          videoUrl: res.video_url || res.videoUrl,
          date: res.date,
          author: res.author,
          fileSize: res.file_size || res.fileSize,
          downloadCount: res.download_count || res.downloadCount || 0,
          accessLevel: mappedLevel,
          createdAt: res.created_at || res.createdAt || new Date().toISOString()
        } as Resource;
      });

      const filtered = allResources.filter(res => {
        if (isLeadership) return true;
        const level = (res.accessLevel || '').toLowerCase();
        if (level.includes('public')) return true;
        if (currentUser && level.includes('member')) return true;
        return false;
      });

      setResources(filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      }));
      setIsLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'resources'));
  }, [currentUser, isMediaTeam, isLeadership, isMember, isMockMode]);

  // 5. Prayer Requests
  useEffect(() => {
    if (isMockMode || !currentUser) {
      if (isMockMode) setPrayerRequests([]);
      return;
    }

    let prayerQuery;
    if (isPrayerTeam) {
      prayerQuery = collection(db, 'prayer_requests');
    } else {
      prayerQuery = query(collection(db, 'prayer_requests'), where('userId', '==', currentUser.id));
    }

    return onSnapshot(prayerQuery, (snapshot) => {
      setPrayerRequests(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PrayerRequest)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'prayer_requests'));
  }, [currentUser, isPrayerTeam, isMockMode]);

  // ✅ FIXED: Auth state listener with real-time profile updates
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        console.log(`[Auth] User logged in: ${user.email} (${user.uid})`);
        // Real-time profile listener for current user
        unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const p = docSnap.data();
            const email = user.email || '';
            const isHardcodedAdmin = email === 'enochapafloe@gmail.com';
            const permissions = [...(p.workerPermissions || [])];
            if (isHardcodedAdmin && !permissions.includes(WorkerPermission.SUPER_ADMIN)) {
              permissions.push(WorkerPermission.SUPER_ADMIN);
            }
            setCurrentUser({
              id: user.uid,
              username: p.username,
              fullName: p.full_name || p.fullName,
              identityRole: p.identity_role || p.identityRole || IdentityRole.MEMBER,
              workerPermissions: permissions,
              email: email,
              phone: p.phone,
              branch: p.branch,
              location: p.location,
              birthday: p.birthday,
              gender: p.gender,
              status: p.status || 'active',
              sermonAccessSuspended: !!(p.sermon_access_suspended || p.sermonAccessSuspended),
              profileUpdateRequested: !!(p.profile_update_requested || p.profileUpdateRequested)
            });
          } else {
            // If profile doesn't exist, try to fetch/create it
            fetchProfile(user.uid, user.email || '');
          }
          setIsLoading(false);
        }, (err) => {
          console.warn('Profile subscription error:', err.message);
          setIsLoading(false);
        });
      } else {
        if (unsubProfile) unsubProfile();
        setCurrentUser(null);
        setIsLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, [fetchProfile]);

  // Online status listener
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const updateSettings = async (section: string, data: any) => {
    setSettings(prev => {
      const currentSection = prev[section as keyof typeof prev];
      const newData =
        typeof data === 'object' && data !== null && !Array.isArray(data)
          ? { ...(typeof currentSection === 'object' ? currentSection : {}), ...data }
          : data;
      const newS = { ...prev, [section]: newData };
      if (!isMockMode) {
        setDoc(doc(db, 'settings', 'global'), { config: newS }, { merge: true }).catch(err => {
          console.error('Settings update failed', err.message);
        });
      }
      return newS;
    });
  };

  const combinedMembers = useMemo(() => {
    // Merge members from 'members' collection and 'profiles' (users) who are members
    const memberIds = new Set(members.map(m => m.id));
    const profileMembers = users
      .filter(u => !memberIds.has(u.id))
      .map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        location: u.location || '',
        branch: u.branch || '',
        category: 'Member', // Default category for profile-based members
        gender: u.gender || Gender.MALE,
        birthday: u.birthday || '',
        customTags: [],
        parentIds: [],
        childrenIds: [],
        followUpNeeded: false,
        sermonAccessSuspended: u.sermonAccessSuspended,
        profileUpdateRequested: u.profileUpdateRequested,
        createdAt: u.createdAt
      }));
    return [...members, ...profileMembers];
  }, [members, users]);

  const usePrayerNotes = (requestId: string) => {
    const [notes, setNotes] = useState<PrayerNote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (isMockMode || !requestId || !currentUser) {
        setNotes([]);
        setLoading(false);
        return;
      }

      // ✅ FIXED: Filter notes by isPrivate if user is not prayer team
      let q;
      const isTeam = currentUser?.workerPermissions?.some(p => 
        [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN, WorkerPermission.PRAYER_TEAM, WorkerPermission.PRAYER_HEAD].includes(p as WorkerPermission)
      ) || isLeadership;

      const isSA = currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN);

      if (isTeam || isSA) {
        q = query(
          collection(db, 'prayer_requests', requestId, 'notes'),
          orderBy('createdAt', 'asc')
        );
      } else {
        q = query(
          collection(db, 'prayer_requests', requestId, 'notes'),
          where('isPrivate', '==', false),
          orderBy('createdAt', 'asc')
        );
      }

      return onSnapshot(q, (snapshot) => {
        setNotes(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PrayerNote)));
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `prayer_requests/${requestId}/notes`);
        setLoading(false);
      });
    }, [requestId]);

    return { notes, loading };
  };

  return {
    currentUser,
    users,
    members: combinedMembers,
    attendance,
    firstTimers,
    absentees,
    announcements: announcements.map(ann => ({
      ...ann,
      status: ann.status || 'Submitted',
      urgency: ann.urgency || 'Routine',
      createdAt: ann.createdAt || new Date().toISOString(),
      category: ann.category || 'General'
    })),
    assets,
    complaints,
    reminders,
    resources,
    events,
    prayerRequests: prayerRequests.map(pr => ({
      ...pr,
      status: pr.status || 'Pending',
      createdAt: pr.createdAt || new Date().toISOString()
    })),
    usePrayerNotes,
    groups,
    activities,
    settings,
    isLoading,
    isOnline,
    connectionVerified,
    isSuperAdmin,
    login: async (u: string, p?: string) => {
      if (isMockMode) {
        const uObj = mockUsers.find(x => x.username === u);
        if (uObj) {
          setCurrentUser(uObj);
          return true;
        }
        return false;
      }
      const email = u.includes('@') ? u : `${u}@ministry.org`;
      try {
        const result = await signInWithEmailAndPassword(auth, email, p || '');
        return !!result.user;
      } catch (error) {
        console.error('Login failed', error);
        return false;
      }
    },
    signUp: async (email: string, p: string, fullName: string) => {
      if (isMockMode) return false;
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const result = await createUserWithEmailAndPassword(auth, email, p);
        if (result.user) {
          try {
            await setDoc(doc(db, 'profiles', result.user.uid), {
              id: result.user.uid,
              full_name: fullName,
              fullName: fullName,
              username: email.split('@')[0],
              email,
              identityRole: IdentityRole.MEMBER,
              identity_role: IdentityRole.MEMBER,
              workerPermissions: [],
              worker_permissions: [],
              status: 'active',
              sermonAccessSuspended: false,
              sermon_access_suspended: false,
              created_at: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          } catch (error) {
            console.error('Profile creation failed', error);
          }
          try {
            await setDoc(doc(db, 'members', result.user.uid), {
              id: result.user.uid,
              full_name: fullName,
              email: email,
              category: 'Member',
              membership_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              follow_up_needed: false
            });
          } catch (error) {
            console.error('Member creation failed', error);
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Sign up failed', error);
        return false;
      }
    },
    signInWithGoogle: async () => {
      if (isMockMode) return false;
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          const docRef = doc(db, 'profiles', result.user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const fullName = result.user.displayName || 'New User';
            const email = result.user.email || '';
            await setDoc(docRef, {
              id: result.user.uid,
              full_name: fullName,
              fullName: fullName,
              username: email.split('@')[0] || 'user',
              email: email,
              identityRole: IdentityRole.MEMBER,
              identity_role: IdentityRole.MEMBER,
              workerPermissions: [],
              worker_permissions: [],
              status: 'active',
              sermonAccessSuspended: false,
              sermon_access_suspended: false,
              created_at: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
            await setDoc(doc(db, 'members', result.user.uid), {
              id: result.user.uid,
              full_name: fullName,
              email: email,
              category: 'Member',
              membership_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              follow_up_needed: false
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Google Sign-In failed', error);
        return false;
      }
    },
    logout: async () => {
      await signOut(auth);
      setCurrentUser(null);
    },
    sendPasswordReset: async (email: string) => {
      if (isMockMode) return true;
      try {
        await sendPasswordResetEmail(auth, email);
        return true;
      } catch (error) {
        console.error('Password reset email failed', error);
        return false;
      }
    },
    updateMyPassword: async (newPassword: string) => {
      if (isMockMode || !auth.currentUser) return false;
      try {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
        return true;
      } catch (error) {
        console.error('Update password failed', error);
        throw error;
      }
    },
    addUser: async (u: any, password?: string) => {
      if (isMockMode) {
        setUsers(prev => [{ ...u, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        let uid = '';
        if (password) {
          const { initializeApp, deleteApp } = await import('firebase/app');
          const { getAuth, createUserWithEmailAndPassword, signOut: secondarySignOut } = await import('firebase/auth');
          const appName = `Secondary-${Date.now()}`;
          const secondaryApp = initializeApp(firebaseConfig, appName);
          const secondaryAuth = getAuth(secondaryApp);
          const result = await createUserWithEmailAndPassword(secondaryAuth, u.email, password);
          uid = result.user.uid;
          await secondarySignOut(secondaryAuth);
          await deleteApp(secondaryApp);
        }
        const profileData = {
          full_name: u.fullName,
          fullName: u.fullName,
          username: u.username || u.email.split('@')[0],
          email: u.email,
          phone: u.phone || '',
          identityRole: u.identityRole || IdentityRole.MEMBER,
          identity_role: u.identityRole || IdentityRole.MEMBER,
          workerPermissions: u.workerPermissions || [],
          worker_permissions: u.workerPermissions || [],
          status: u.status || 'active',
          sermonAccessSuspended: u.sermonAccessSuspended || false,
          sermon_access_suspended: u.sermonAccessSuspended || false,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        if (uid) {
          await setDoc(doc(db, 'profiles', uid), { ...profileData, id: uid });
          // Also create a member record for the new user
          await setDoc(doc(db, 'members', uid), {
            id: uid,
            full_name: u.fullName,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone || '',
            category: 'Member',
            membership_date: new Date().toISOString().split('T')[0],
            membershipDate: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            follow_up_needed: false,
            followUpNeeded: false
          });
        } else {
          const docRef = await addDoc(collection(db, 'profiles'), profileData);
          // Also create a member record
          await setDoc(doc(db, 'members', docRef.id), {
            id: docRef.id,
            full_name: u.fullName,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone || '',
            category: 'Member',
            membership_date: new Date().toISOString().split('T')[0],
            membershipDate: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            follow_up_needed: false,
            followUpNeeded: false
          });
        }
        return true;
      } catch (e) {
        console.error("Add User Error:", e);
        throw e;
      }
    },
    updateUser: async (id: string, u: any) => {
      if (isMockMode) {
        setUsers(prev => prev.map(x => x.id === id ? { ...x, ...u } : x));
        return true;
      }
      try {
        const updateData: any = {};
        // ✅ FIXED: Filter out undefined values to prevent Firestore errors
        if (u.fullName !== undefined && u.fullName !== null) {
          updateData.full_name = u.fullName;
          updateData.fullName = u.fullName;
        }
        if (u.email !== undefined && u.email !== null) updateData.email = u.email;
        if (u.phone !== undefined && u.phone !== null) updateData.phone = u.phone;
        if (u.branch !== undefined && u.branch !== null) updateData.branch = u.branch;
        if (u.identityRole !== undefined && u.identityRole !== null) {
          updateData.identityRole = u.identityRole;
          updateData.identity_role = u.identityRole;
        }
        if (u.workerPermissions !== undefined && u.workerPermissions !== null) {
          updateData.workerPermissions = u.workerPermissions;
          updateData.worker_permissions = u.workerPermissions;
        }
        if (u.status !== undefined && u.status !== null) updateData.status = u.status;
        if (u.sermonAccessSuspended !== undefined && u.sermonAccessSuspended !== null) {
          updateData.sermonAccessSuspended = u.sermonAccessSuspended;
          updateData.sermon_access_suspended = u.sermonAccessSuspended;
        }
        if (u.profileUpdateRequested !== undefined && u.profileUpdateRequested !== null) updateData.profile_update_requested = u.profileUpdateRequested;
        
        if (Object.keys(updateData).length > 0) {
          await updateDoc(doc(db, 'profiles', id), updateData);
          
          // Also update member record if it exists to keep data in sync
          try {
            const memberUpdate: any = {};
            if (u.fullName) memberUpdate.full_name = u.fullName;
            if (u.email) memberUpdate.email = u.email;
            if (u.phone) memberUpdate.phone = u.phone;
            if (u.branch) memberUpdate.branch = u.branch;
            if (u.identityRole) {
              memberUpdate.identityRole = u.identityRole;
              memberUpdate.identity_role = u.identityRole;
            }
            if (Object.keys(memberUpdate).length > 0) {
              await updateDoc(doc(db, 'members', id), memberUpdate);
            }
          } catch (e) {
            // Member record might not exist, ignore
          }
        }
        return true;
      } catch (e) {
        console.error("Update User Error:", e);
        return false;
      }
    },
    requestProfileUpdate: async (id: string, requested: boolean) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'profiles', id), { profile_update_requested: requested });
      try {
        await updateDoc(doc(db, 'members', id), { profile_update_requested: requested });
      } catch (e) {
        // Member record might not exist with same ID
      }
    },
    updateProfile: async (id: string, data: any) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'profiles', id), {
        full_name: data.fullName,
        phone: data.phone,
        branch: data.branch,
        profile_update_requested: false
      });
      try {
        await updateDoc(doc(db, 'members', id), {
          full_name: data.fullName,
          phone: data.phone,
          branch: data.branch,
          birthday: data.birthday,
          location: data.location,
          gender: data.gender,
          profile_update_requested: false
        });
      } catch (e) {
        // Member record might not exist with same ID
      }
    },
    deleteUser: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'profiles', id));
    },
    resetUserPassword: (id: string) => {
      const user = users.find(u => u.id === id);
      if (user && user.email) {
        sendPasswordResetEmail(auth, user.email).catch(console.error);
        logActivity(`Triggered password reset email for user: ${user.fullName}`, 'SECURITY');
        return 'Reset Email Sent';
      }
      return 'User Not Found';
    },
    addMember: async (m: any) => {
      if (isMockMode) {
        setMembers(prev => [{ ...m, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        let uid = '';
        if (m.email) {
          try {
            const defaultPassword = 'ChangeMe123!';
            const { initializeApp, deleteApp } = await import('firebase/app');
            const { getAuth, createUserWithEmailAndPassword, signOut: secondarySignOut } = await import('firebase/auth');
            const appName = `Member-${Date.now()}`;
            const secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);
            const result = await createUserWithEmailAndPassword(secondaryAuth, m.email, defaultPassword);
            uid = result.user.uid;
            await secondarySignOut(secondaryAuth);
            await deleteApp(secondaryApp);
            await setDoc(doc(db, 'profiles', uid), {
              id: uid,
              full_name: m.fullName,
              username: m.email.split('@')[0],
              email: m.email,
              phone: m.phone || '',
              identity_role: IdentityRole.MEMBER,
              worker_permissions: [],
              status: 'active',
              created_at: new Date().toISOString()
            });
          } catch (authError) {
            console.warn("Could not create auth account for member (maybe email exists):", authError);
          }
        }
        const memberData = {
          full_name: m.fullName || '',
          gender: m.gender || Gender.MALE,
          birthday: m.birthday || '',
          phone: m.phone || '',
          email: m.email || '',
          location: m.location || '',
          branch: m.branch || '',
          category: m.category || 'Member',
          custom_tags: m.customTags || [],
          parent_ids: m.parentIds || [],
          children_ids: m.childrenIds || [],
          membership_date: m.membershipDate || new Date().toISOString().split('T')[0],
          follow_up_needed: !!m.followUpNeeded,
          notes: m.notes || '',
          created_at: new Date().toISOString()
        };
        if (uid) {
          await setDoc(doc(db, 'members', uid), { ...memberData, id: uid });
        } else {
          await addDoc(collection(db, 'members'), memberData);
        }
        return true;
      } catch (e) {
        console.error("Add Member Error:", e);
        return false;
      }
    },
    updateMember: async (id: string, m: any) => {
      if (isMockMode) {
        setMembers(prev => prev.map(x => x.id === id ? { ...x, ...m } : x));
        return true;
      }
      try {
        await updateDoc(doc(db, 'members', id), {
          full_name: m.fullName || '',
          fullName: m.fullName || '',
          gender: m.gender || Gender.MALE,
          birthday: m.birthday || '',
          phone: m.phone || '',
          email: m.email || '',
          location: m.location || '',
          branch: m.branch || '',
          category: m.category || 'Member',
          custom_tags: m.customTags || [],
          customTags: m.customTags || [],
          parent_ids: m.parentIds || [],
          parentIds: m.parentIds || [],
          children_ids: m.childrenIds || [],
          childrenIds: m.childrenIds || [],
          follow_up_needed: !!m.followUpNeeded,
          followUpNeeded: !!m.followUpNeeded,
          notes: m.notes || '',
          profile_update_requested: !!m.profileUpdateRequested,
          profileUpdateRequested: !!m.profileUpdateRequested,
          sermon_access_suspended: !!m.sermonAccessSuspended,
          sermonAccessSuspended: !!m.sermonAccessSuspended
        });
        
        // Also update profile if it exists
        try {
          const profileRef = doc(db, 'profiles', id);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            await updateDoc(profileRef, {
              full_name: m.fullName || profileSnap.data().full_name,
              fullName: m.fullName || profileSnap.data().fullName,
              email: m.email || profileSnap.data().email,
              phone: m.phone || profileSnap.data().phone,
              sermonAccessSuspended: !!m.sermonAccessSuspended,
              sermon_access_suspended: !!m.sermonAccessSuspended,
              profileUpdateRequested: !!m.profileUpdateRequested,
              profile_update_requested: !!m.profileUpdateRequested
            });
          }
        } catch (err) {
          console.warn('Profile sync failed during member update', err);
        }
        
        return true;
      } catch (e) {
        console.error("Update Member Error:", e);
        return false;
      }
    },
    promoteToMember: async (visitorId: string, memberData: any) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'members'), {
        full_name: memberData.fullName || '',
        gender: memberData.gender || Gender.MALE,
        birthday: memberData.birthday || '',
        phone: memberData.phone || '',
        email: memberData.email || '',
        location: memberData.location || '',
        branch: memberData.branch || '',
        category: memberData.category || 'Member',
        custom_tags: memberData.customTags || [],
        parentIds: memberData.parentIds || [],
        childrenIds: memberData.childrenIds || [],
        membership_date: memberData.membershipDate || new Date().toISOString().split('T')[0],
        follow_up_needed: !!memberData.followUpNeeded,
        notes: memberData.notes || '',
        created_at: new Date().toISOString()
      });
      await updateDoc(doc(db, 'first_timers', visitorId), {
        follow_up_status: 'Member'
      });
    },
    deleteMember: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'members', id));
    },
    importMembers: async (list: any[]) => {
      if (isMockMode) return;
      for (const m of list) {
        await addDoc(collection(db, 'members'), {
          full_name: m.fullName,
          gender: m.gender,
          birthday: m.birthday,
          phone: m.phone,
          email: m.email,
          location: m.location,
          branch: m.branch || '',
          category: m.category || 'Member',
          membership_date: m.membershipDate || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      }
    },
    addAttendance: async (r: any) => {
      if (isMockMode) {
        setAttendance(prev => [{ ...r, id: Math.random().toString() }, ...prev]);
        return 'saved';
      }
      try {
        await addDoc(collection(db, 'attendance'), {
          service_date: r.date,
          service_type: r.serviceType,
          branch: r.branch,
          segment_name: r.segmentName,
          male_count: r.maleCount,
          female_count: r.femaleCount,
          children_count: r.childrenCount,
          total_count: r.totalCount,
          recorded_by: currentUser?.fullName || 'Staff',
          recorded_by_id: currentUser?.id,
          created_at: new Date().toISOString()
        });
        return 'saved';
      } catch (e) {
        console.error("Add Attendance Error:", e);
        return 'error';
      }
    },
    updateAttendance: async (id: string, r: any) => {
      if (isMockMode) {
        setAttendance(prev => prev.map(x => x.id === id ? { ...x, ...r } : x));
        return true;
      }
      try {
        await updateDoc(doc(db, 'attendance', id), {
          service_date: r.date,
          service_type: r.serviceType,
          branch: r.branch,
          segment_name: r.segmentName,
          male_count: r.maleCount,
          female_count: r.femaleCount,
          children_count: r.childrenCount,
          total_count: r.totalCount,
          notes: r.notes
        });
        return true;
      } catch (e) {
        console.error("Update Attendance Error:", e);
        return false;
      }
    },
    deleteAttendance: async (id: string) => {
      if (isMockMode) {
        setAttendance(prev => prev.filter(x => x.id !== id));
        return true;
      }
      try {
        await deleteDoc(doc(db, 'attendance', id));
        return true;
      } catch (e) {
        console.error("Delete Attendance Error:", e);
        return false;
      }
    },
    addFirstTimer: async (f: any) => {
      if (isMockMode) {
        setFirstTimers(prev => [{ ...f, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        await addDoc(collection(db, 'first_timers'), {
          full_name: f.fullName,
          phone: f.phone,
          email: f.email,
          gender: f.gender,
          age_group: f.ageGroup,
          occupation: f.occupation,
          marital_status: f.maritalStatus,
          prayer_request: f.prayerRequest,
          preferred_contact_method: f.preferredContactMethod,
          source: f.source,
          invited_by: f.invitedBy,
          visit_date: f.visitDate,
          follow_up_status: f.followUpStatus,
          location: f.location,
          recorded_by: currentUser?.fullName || 'Staff',
          created_at: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.error("First Timer Sync Error:", e);
        return false;
      }
    },
    addAbsentee: async (ab: any) => {
      if (isMockMode) {
        setAbsentees(prev => [{ ...ab, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        await addDoc(collection(db, 'absentees'), {
          member_name: ab.memberName,
          phone: ab.phone,
          last_seen_date: ab.lastSeenDate,
          weeks_absent: ab.weeksAbsent,
          priority: ab.priority,
          status: ab.status,
          notes: ab.notes,
          recorded_by: currentUser?.fullName || 'Staff',
          created_at: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.error("Add Absentee Error:", e);
        return false;
      }
    },
    updateAbsentee: async (id: string, data: any) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'absentees', id), data);
    },
    deleteAbsentee: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'absentees', id));
    },
    addAnnouncement: async (an: any) => {
      if (isMockMode) {
        setAnnouncements(prev => [{ ...an, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        await addDoc(collection(db, 'announcements'), {
          type: an.type,
          title: an.title,
          description: an.description,
          category: an.category,
          urgency: an.urgency,
          status: 'Submitted',
          submitted_by: currentUser?.fullName || 'Staff',
          created_at: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.error("Add Announcement Error:", e);
        return false;
      }
    },
    updateAnnouncementStatus: async (id: string, status: string) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'announcements', id), { status });
    },
    deleteAnnouncement: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'announcements', id));
    },
    addAsset: async (as: any) => {
      if (isMockMode) {
        setAssets(prev => [{ ...as, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        await addDoc(collection(db, 'assets'), {
          name: as.name,
          category: as.category,
          total_quantity: as.totalQuantity,
          good_condition: as.goodCondition,
          manageable: as.manageable,
          discarded: as.discarded,
          location: as.location,
          value: as.value,
          created_at: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.error("Add Asset Error:", e);
        return false;
      }
    },
    updateAsset: async (id: string, as: any) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'assets', id), {
        name: as.name,
        category: as.category,
        total_quantity: as.totalQuantity,
        good_condition: as.goodCondition,
        manageable: as.manageable,
        discarded: as.discarded,
        location: as.location,
        value: as.value
      });
    },
    deleteAsset: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'assets', id));
    },
    addComplaint: async (c: any) => {
      if (isMockMode) {
        setComplaints(prev => [{ ...c, id: Math.random().toString() }, ...prev]);
        return true;
      }
      try {
        await addDoc(collection(db, 'complaints'), {
          category: c.category,
          title: c.title,
          description: c.description,
          priority: c.priority,
          status: 'Open',
          submitted_by: currentUser?.fullName || 'Staff',
          created_at: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.error("Add Complaint Error:", e);
        return false;
      }
    },
    updateComplaintStatus: async (id: string, status: string) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'complaints', id), { status });
    },
    deleteComplaint: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'complaints', id));
    },
    addReminder: async (r: any) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'reminders'), {
        first_timer_id: r.firstTimerId,
        first_timer_name: r.firstTimerName,
        assigned_to: r.assignedTo,
        date: r.date,
        time: r.time,
        type: r.type,
        status: r.status,
        notes: r.notes,
        created_at: new Date().toISOString()
      });
    },
    updateReminderStatus: async (id: string, status: string) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'reminders', id), { status });
    },
    addResource: async (res: any) => {
      if (isMockMode) return;
      try {
        await addDoc(collection(db, 'resources'), {
          title: res.title,
          description: res.description,
          category: res.category,
          file_url: res.fileUrl,
          thumbnail_url: res.thumbnailUrl,
          video_url: res.videoUrl,
          date: res.date,
          author: res.author,
          file_size: res.fileSize,
          access_level: res.accessLevel || SermonAccessLevel.PUBLIC,
          accessLevel: res.accessLevel || SermonAccessLevel.PUBLIC,
          is_featured: !!res.isFeatured,
          isFeatured: !!res.isFeatured,
          notify_users: !!res.notifyUsers,
          notifyUsers: !!res.notifyUsers,
          download_count: 0,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Add resource failed', error);
      }
    },
    updateResource: async (id: string, res: any) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'resources', id), {
        title: res.title,
        description: res.description,
        category: res.category,
        file_url: res.fileUrl,
        thumbnail_url: res.thumbnailUrl,
        video_url: res.videoUrl,
        date: res.date,
        author: res.author,
        file_size: res.fileSize,
        access_level: res.accessLevel,
        accessLevel: res.accessLevel,
        is_featured: !!res.isFeatured,
        isFeatured: !!res.isFeatured,
        notify_users: !!res.notifyUsers,
        notifyUsers: !!res.notifyUsers
      });
    },
    deleteResource: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'resources', id));
    },
    addEvent: async (e: any) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'events'), {
        ...e,
        image_url: e.imageUrl,
        is_recurring: e.isRecurring,
        recurring_day: e.recurringDay,
        created_at: new Date().toISOString()
      });
    },
    updateEvent: async (id: string, e: any) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'events', id), {
        ...e,
        image_url: e.imageUrl,
        is_recurring: e.isRecurring,
        recurring_day: e.recurringDay
      });
    },
    deleteEvent: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'events', id));
    },
    addPrayerRequest: async (pr: any) => {
      if (isMockMode || !currentUser) return;
      try {
        await addDoc(collection(db, 'prayer_requests'), {
          ...pr,
          userId: currentUser.id,
          userName: currentUser.fullName || 'Member',
          userEmail: currentUser.email || '',
          userPhone: currentUser.phone || '',
          branch: currentUser.branch || '',
          isPrivate: pr.isPrivate ?? false,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          visibleToIds: pr.visibleToIds || []
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'prayer_requests');
      }
    },
    updatePrayerRequest: async (id: string, updates: any) => {
      if (isMockMode) return;
      try {
        await updateDoc(doc(db, 'prayer_requests', id), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'prayer_requests');
      }
    },
    deletePrayerRequest: async (id: string) => {
      if (isMockMode) return;
      try {
        await deleteDoc(doc(db, 'prayer_requests', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'prayer_requests');
      }
    },
    addPrayerNote: async (requestId: string, note: Partial<PrayerNote>) => {
      if (isMockMode || !currentUser) return;
      try {
        const noteData = {
          ...note,
          authorId: currentUser.id,
          authorName: currentUser.fullName,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'prayer_requests', requestId, 'notes'), noteData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `prayer_requests/${requestId}/notes`);
      }
    },
    updatePrayerNote: async (requestId: string, noteId: string, updates: Partial<PrayerNote>) => {
      if (isMockMode) return;
      try {
        await updateDoc(doc(db, 'prayer_requests', requestId, 'notes', noteId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `prayer_requests/${requestId}/notes/${noteId}`);
      }
    },
    deletePrayerNote: async (requestId: string, noteId: string) => {
      if (isMockMode) return;
      try {
        await deleteDoc(doc(db, 'prayer_requests', requestId, 'notes', noteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `prayer_requests/${requestId}/notes/${noteId}`);
      }
    },
    addGroup: async (group: Partial<Group>) => {
      if (isMockMode) return;
      try {
        await addDoc(collection(db, 'groups'), {
          ...group,
          memberIds: group.memberIds || [],
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'groups');
      }
    },
    updateGroup: async (id: string, updates: Partial<Group>) => {
      if (isMockMode) return;
      try {
        await updateDoc(doc(db, 'groups', id), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'groups');
      }
    },
    deleteGroup: async (id: string) => {
      if (isMockMode) return;
      try {
        await deleteDoc(doc(db, 'groups', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'groups');
      }
    },
    joinGroup: async (groupId: string) => {
      if (isMockMode || !currentUser) return;
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const currentMembers = groupSnap.data().memberIds || [];
          if (!currentMembers.includes(currentUser.id)) {
            await updateDoc(groupRef, {
              memberIds: [...currentMembers, currentUser.id]
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'groups');
      }
    },
    leaveGroup: async (groupId: string) => {
      if (isMockMode || !currentUser) return;
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const currentMembers = groupSnap.data().memberIds || [];
          await updateDoc(groupRef, {
            memberIds: currentMembers.filter((id: string) => id !== currentUser.id)
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'groups');
      }
    },
    incrementDownloadCount: async (id: string) => {
      if (isMockMode) {
        setResources(prev =>
          prev.map(r => (r.id === id ? { ...r, downloadCount: r.downloadCount + 1 } : r))
        );
        return;
      }
      await updateDoc(doc(db, 'resources', id), { download_count: increment(1) });
    },
    addAssetCategory: (cat: string) =>
      updateSettings('assetCategories', [...settings.assetCategories, cat]),
    addMemberCategory: (cat: string) =>
      updateSettings('memberCategories', [...settings.memberCategories, cat]),
    deleteMemberCategory: (cat: string) =>
      updateSettings(
        'memberCategories',
        settings.memberCategories.filter(c => c !== cat)
      ),
    addCustomTag: (tag: string) =>
      updateSettings('customTags', [...settings.customTags, tag]),
    deleteCustomTag: (tag: string) =>
      updateSettings(
        'customTags',
        settings.customTags.filter(t => t !== tag)
      ),
    addServiceType: (type: string) =>
      updateSettings('serviceTypes', [...(settings.serviceTypes || []), type]),
    deleteServiceType: (type: string) =>
      updateSettings('serviceTypes', (settings.serviceTypes || []).filter(t => t !== type)),
    addBranch: (branch: string) =>
      updateSettings('branches', [...(settings.branches || []), branch]),
    deleteBranch: (branch: string) =>
      updateSettings('branches', (settings.branches || []).filter(b => b !== branch)),
    addAttendanceSegment: (segment: string) =>
      updateSettings('attendanceSegments', [...(settings.attendanceSegments || []), segment]),
    deleteAttendanceSegment: (segment: string) =>
      updateSettings('attendanceSegments', (settings.attendanceSegments || []).filter(s => s !== segment)),
    updateSettings,
    updateLandingPageConfig: async (config: LandingPageConfig) => {
      if (isMockMode) {
        setLandingPageConfig(config);
        return;
      }
      await setDoc(doc(db, 'landingPageConfigs', 'main'), config);
    },
    updateBookstoreConfig: async (config: BookstoreConfig) => {
      if (isMockMode) {
        setBookstoreConfig(config);
        return;
      }
      await setDoc(doc(db, 'settings', 'bookstore'), config);
    },
    updatePaymentConfig: async (config: PaymentConfig) => {
      if (isMockMode) {
        setPaymentConfig(config);
        return;
      }
      await setDoc(doc(db, 'settings', 'payment'), config);
    },
    addBroadcast: async (b: Partial<Broadcast>) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'broadcasts'), {
        ...b,
        createdAt: new Date().toISOString()
      });
    },
    updateBroadcast: async (id: string, b: Partial<Broadcast>) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'broadcasts', id), b);
    },
    deleteBroadcast: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'broadcasts', id));
    },
    addOrder: async (o: Partial<Order>) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'orders'), {
        ...o,
        status: o.status || 'Pending',
        createdAt: new Date().toISOString()
      });
    },
    updateOrderStatus: async (id: string, status: Order['status']) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'orders', id), { status });
    },
    addDonation: async (d: Partial<Donation>) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'donations'), {
        ...d,
        createdAt: new Date().toISOString()
      });
    },
    addReview: async (r: Partial<Review>) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'reviews'), {
        ...r,
        createdAt: new Date().toISOString()
      });
    },
    addBook: async (b: any) => {
      if (isMockMode) return;
      await addDoc(collection(db, 'books'), {
        ...b,
        createdAt: new Date().toISOString()
      });
    },
    updateBook: async (id: string, b: any) => {
      if (isMockMode) return;
      await updateDoc(doc(db, 'books', id), {
        ...b,
        updatedAt: new Date().toISOString()
      });
    },
    deleteBook: async (id: string) => {
      if (isMockMode) return;
      await deleteDoc(doc(db, 'books', id));
    },
    broadcasts,
    orders,
    donations,
    reviews,
    books,
    landingPageConfig,
    bookstoreConfig,
    paymentConfig,
    refresh: () => {
      if (isMockMode) {
        setAttendance(mockAttendance);
        setFirstTimers(mockFirstTimers);
        setAssets(mockAssets);
        setUsers(mockUsers);
        setMembers(mockMembers);
        setAbsentees(mockAbsentees);
        setAnnouncements(mockAnnouncements);
        setComplaints(mockComplaints);
        setResources(mockResources);
      }
    }
  };
}