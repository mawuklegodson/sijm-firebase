
export enum IdentityRole {
  MEMBER = 'Member',
  PASTOR = 'Pastor',
  APOSTLE = 'Apostle',
  PROPHET = 'Prophet',
  TEACHER = 'Teacher',
  EVANGELIST = 'Evangelist',
  LEADER = 'Leader',
  GROUP_HEAD = 'Group Head',
  BRANCH_HEAD = 'Branch Head',
  REGIONAL_HEAD = 'Regional Head',
  NATIONAL_HEAD = 'National Head',
  GENERAL_HEAD = 'General Head'
}

export enum WorkerPermission {
  USHER = 'Usher',
  ADMIN = 'Admin',
  MEDIA_TEAM = 'Media Team',
  SUPER_ADMIN = 'Super Admin',
  PRAYER_TEAM = 'Prayer Team',
  PRAYER_HEAD = 'Prayer Head'
}

export enum SermonAccessLevel {
  PUBLIC = 'General Public',
  MEMBER = 'Member-Only',
  LEADERSHIP = 'Leadership-Only'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female'
}

export enum AgeGroup {
  CHILD = 'Child',
  TEEN = 'Teen',
  YOUTH = 'Youth',
  ADULT = 'Adult',
  SENIOR = 'Senior'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum ReminderType {
  CALL = 'Call',
  VISIT = 'Visit',
  EMAIL = 'Email',
  TEXT = 'Text'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  identityRole: IdentityRole;
  workerPermissions: WorkerPermission[];
  email: string;
  phone?: string;
  branch?: string;
  dominion?: string; // Region/Nation/General
  location?: string;
  birthday?: string;
  gender?: Gender;
  status: 'active' | 'inactive';
  sermonAccessSuspended?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  lastLogin?: string;
  profileUpdateRequested?: boolean;
  createdAt?: string;
  activityCount?: number;
  password?: string;
}

export interface Member {
  id: string;
  fullName: string;
  gender: Gender;
  birthday: string;
  phone?: string; // Optional as not all use phones
  email?: string;
  location: string;
  branch?: string;
  dominion?: string; // Region/Nation/General
  category: 'Member' | 'Officer' | 'Child' | 'Teen' | 'Youth' | 'Elder' | string;
  customTags?: string[];
  parentIds?: string[];
  childrenIds?: string[];
  membershipDate: string;
  followUpNeeded: boolean;
  profileUpdateRequested?: boolean;
  followUpReason?: string;
  notes?: string;
  sermonAccessSuspended?: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  serviceType: string;
  branch: string;
  segmentName: string;
  maleCount: number;
  femaleCount: number;
  childrenCount: number;
  totalCount: number;
  notes?: string;
  recordedBy: string;
  recordedById?: string;
  createdAt: string;
}

export interface FirstTimer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  gender: Gender;
  ageGroup: AgeGroup;
  occupation?: string;
  maritalStatus?: string;
  prayerRequest?: string;
  preferredContactMethod?: string;
  source: string;
  invitedBy?: string;
  visitDate: string;
  followUpStatus: 'Not Contacted' | 'Called' | 'Visited' | 'Scheduled' | 'Not Interested' | 'Member';
  notes?: string;
  location?: string;
  purpose?: string;
  membershipInterest?: boolean;
  recordedBy?: string;
}

export interface Absentee {
  id: string;
  memberId?: string; // Link to actual member
  memberName: string;
  phone?: string;
  lastSeenDate: string;
  dateNoticed: string;
  weeksAbsent: number;
  reason?: string;
  priority: Priority;
  status: 'Recorded' | 'Contacted' | 'Resolved';
  notes?: string;
  recordedBy?: string;
}

export interface Announcement {
  id: string;
  type: 'Announcement' | 'Equipment' | 'Supply' | 'Maintenance';
  title: string;
  description: string;
  category: string;
  urgency: 'Routine' | 'Needed Soon' | 'Urgent' | 'Critical';
  status: 'Submitted' | 'Approved' | 'In Progress' | 'Completed' | 'Rejected';
  submittedBy: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  goodCondition: number;
  manageable: number;
  discarded: number;
  location: string;
  value: number;
}

export interface Complaint {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: Priority;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  submittedBy: string;
  createdAt: string;
}

export interface FollowUpReminder {
  id: string;
  firstTimerId: string;
  firstTimerName: string;
  assignedTo: string;
  date: string;
  time: string;
  type: ReminderType;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'Sermon' | 'Bulletin' | 'Music' | 'Document' | 'Video' | 'Other' | 'Bible Studies' | 'Morning Devotion' | 'Prayer Guides' | 'Evening Reflection' | 'Explore Devotionals';
  tags?: string[];
  fileUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string; // For high-bitrate background video support
  date: string;
  author?: string;
  fileSize?: string;
  downloadCount: number;
  accessLevel: SermonAccessLevel;
  isFeatured?: boolean;
  notifyUsers?: boolean;
  notificationMessage?: string;
  createdAt: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  imageUrl?: string;
  isRecurring?: boolean;
  recurringDay?: string;
  createdAt: string;
}

export interface PrayerNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface PrayerRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  subject: string;
  content: string;
  isPrivate: boolean;
  status: 'Pending' | 'Prayed' | 'Answered';
  createdAt: string;
  category?: string;
  anonymous?: boolean;
  notes?: PrayerNote[];
  visibleToIds?: string[];
  branch?: string;
}

export interface LandingPageConfig {
  id: string;
  branding: {
    favicon: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  hero: {
    title: string;
    subtitle: string;
    backgroundType: 'image' | 'video';
    backgroundUrl: string;
    parallax: boolean;
    typography: {
      h1Size: string;
      h2Size: string;
      fontFamily: string;
    };
  };
  statsCounter?: {
    stat1Label: string; stat1Value: string;
    stat2Label: string; stat2Value: string;
    stat3Label: string; stat3Value: string;
    stat4Label: string; stat4Value: string;
  };
  aboutSection?: {
    heading: string;
    subheading: string;
    paragraph1: string;
    paragraph2: string;
  };
  footer?: {
    aboutText: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  sections: LandingPageSection[];
  seo?: {
    title: string;
    description: string;
  };
  advanced?: {
    customCss: string;
    customJs: string;
  };
  updatedAt: string;
}

export interface LandingPageSection {
  id: string;
  type: 'text' | 'image' | 'video' | 'cta' | 'features';
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  order: number;
  active: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  type: 'ebook-free' | 'ebook-paid' | 'physical' | 'both';
  price?: number;
  pages: number;
  rating: number;
  reviews: number;
  description: string;
  excerpt?: string;
  fileUrl?: string;
  tags: string[];
  featured?: boolean;
  new?: boolean;
  soldOut?: boolean;
  isComingSoon?: boolean;
  comingSoonDate?: string;
  createdAt?: string;
}

export interface BookstoreConfig {
  id: string;
  isComingSoon: boolean;
  categories: string[];
  updatedAt: string;
}

export interface PaymentConfig {
  id: string;
  stripeEnabled: boolean;
  paystackEnabled: boolean;
  currency: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: 'Cell' | 'Department' | 'Fellowship' | 'Other';
  headId: string;
  headName: string;
  memberIds: string[];
  meetingTime?: string;
  meetingLocation?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  unreadCount: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
  encrypted?: boolean;
}

export interface SermonQuestion {
  id: string;
  sermonId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
  answerCount: number;
}

export interface SermonAnswer {
  id: string;
  questionId: string;
  sermonId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
  likes: string[];
}

export interface Broadcast {
  id: string;
  title?: string;
  message: string;
  type: 'info' | 'urgent' | 'promo';
  active: boolean;
  isClosable: boolean;
  startDate?: string;
  endDate?: string;
  pushEnabled?: boolean;
  
  priority?: 'high' | 'normal' | 'low';
  target?: {
    audience: 'all' | 'members' | 'leadership' | 'groups' | 'custom';
    groupIds?: string[];
    branches?: string[];
  };
  playSound?: boolean;
  vibrate?: boolean;
  isRecurring?: boolean;
  recurringSchedule?: 'daily' | 'weekly' | 'monthly';
  
  createdAt: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: {
    id: string;
    title: string;
    price: number;
    type: 'Digital' | 'Physical';
  }[];
  total: number;
  currency: string;
  paymentMethod: 'stripe' | 'paystack' | 'Stripe' | 'Paystack' | string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  createdAt: string;
}

export interface Donation {
  id: string;
  userId?: string;
  donorEmail: string;
  donorName: string;
  amount: number;
  currency: string;
  category: string;
  paymentMethod: 'stripe' | 'paystack' | 'Stripe' | 'Paystack' | string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'question' | 'answer' | 'like' | 'system' | 'broadcast';
  link?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    sermonId?: string;
    questionId?: string;
    answerId?: string;
    senderId?: string;
    senderName?: string;
  };
}
