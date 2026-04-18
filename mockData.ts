
import { AttendanceRecord, FirstTimer, User, IdentityRole, WorkerPermission, Gender, AgeGroup, Asset, Complaint, Priority, Absentee, Announcement, Resource, SermonAccessLevel, Member, ChurchEvent, FollowUpReminder, ReminderType } from './types.ts';

export const mockResources: Resource[] = [
  { id: '1', title: 'The Power of Faith', description: 'Sunday Sermon by Pastor James on the transformative power of faith.', category: 'Sermon', fileUrl: 'https://drive.google.com/file/d/1_y_v9_x_z_w_u_t_s_r_q_p_o_n_m_l_k_j_i_h_g_f_e_d_c_b_a/view?usp=sharing', date: '2023-10-22', author: 'Pastor James', fileSize: '15MB', downloadCount: 124, createdAt: '2023-10-22T12:00:00Z', accessLevel: SermonAccessLevel.PUBLIC },
  { id: '2', title: 'Weekly Bulletin - Oct 22', description: 'Church announcements and service order for October 22nd.', category: 'Bulletin', fileUrl: 'https://example.com/bulletin-oct22.pdf', date: '2023-10-22', author: 'Admin Office', fileSize: '2MB', downloadCount: 85, createdAt: '2023-10-20T09:00:00Z', accessLevel: SermonAccessLevel.MEMBER },
  { id: '3', title: 'Worship Lyrics - Morning Service', description: 'Lyrics for the songs to be sung during the morning service.', category: 'Music', fileUrl: 'https://example.com/lyrics-oct22.pdf', date: '2023-10-22', author: 'Worship Team', fileSize: '1MB', downloadCount: 210, createdAt: '2023-10-21T15:00:00Z', accessLevel: SermonAccessLevel.LEADERSHIP },
];

export const mockUsers: User[] = [
  { id: '1', username: 'admin', fullName: 'Super Admin', identityRole: IdentityRole.LEADER, workerPermissions: [WorkerPermission.SUPER_ADMIN], email: 'admin@gracecenter.com', status: 'active', createdAt: '2023-01-01', activityCount: 150 },
  { id: '2', username: 'usher_john', fullName: 'John Doe', identityRole: IdentityRole.MEMBER, workerPermissions: [WorkerPermission.USHER], email: 'john@gracecenter.com', status: 'active', phone: '+1234567890', createdAt: '2023-05-10', activityCount: 84 },
  { id: '3', username: 'usher_sarah', fullName: 'Sarah Smith', identityRole: IdentityRole.MEMBER, workerPermissions: [WorkerPermission.USHER], email: 'sarah@gracecenter.com', status: 'active', phone: '+1987654321', createdAt: '2023-06-15', activityCount: 92 },
  { id: '4', username: 'member_jane', fullName: 'Jane Doe', identityRole: IdentityRole.MEMBER, workerPermissions: [], email: 'jane@gracecenter.com', status: 'active', phone: '+1122334455', createdAt: '2023-07-20', activityCount: 12 },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: '1', date: '2023-10-22', serviceType: 'Morning Service', branch: 'Main Sanctuary', segmentName: 'Main Hall', maleCount: 150, femaleCount: 180, childrenCount: 65, totalCount: 395, recordedBy: 'John Doe', createdAt: '2023-10-22T10:00:00Z' },
  { id: '2', date: '2023-10-15', serviceType: 'Morning Service', branch: 'Main Sanctuary', segmentName: 'Main Hall', maleCount: 142, femaleCount: 175, childrenCount: 58, totalCount: 375, recordedBy: 'Sarah Smith', createdAt: '2023-10-15T10:00:00Z' },
  { id: '3', date: '2023-10-08', serviceType: 'Morning Service', branch: 'Annex A', segmentName: 'Overflow 1', maleCount: 155, femaleCount: 190, childrenCount: 70, totalCount: 415, recordedBy: 'John Doe', createdAt: '2023-10-08T10:00:00Z' },
  { id: '4', date: '2023-10-25', serviceType: 'Midweek Service', branch: 'Main Sanctuary', segmentName: 'Main Hall', maleCount: 45, femaleCount: 60, childrenCount: 12, totalCount: 117, recordedBy: 'John Doe', createdAt: '2023-10-25T18:00:00Z' },
];

export const mockFirstTimers: FirstTimer[] = [
  { id: '1', fullName: 'Michael Brown', phone: '+123456789', gender: Gender.MALE, ageGroup: AgeGroup.YOUTH, source: 'Friend/Member Invitation', visitDate: '2023-10-22', followUpStatus: 'Called', location: 'North Side', membershipInterest: true },
  { id: '2', fullName: 'Emily Davis', phone: '+198765432', gender: Gender.FEMALE, ageGroup: AgeGroup.ADULT, source: 'Social Media - Instagram', visitDate: '2023-10-22', followUpStatus: 'Not Contacted', location: 'Downtown' },
  { id: '3', fullName: 'James Wilson', phone: '+112233445', gender: Gender.MALE, ageGroup: AgeGroup.SENIOR, source: 'Drove By', visitDate: '2023-10-15', followUpStatus: 'Member', location: 'East Village' },
];

export const mockAbsentees: Absentee[] = [
  { id: '1', memberName: 'Robert Johnson', phone: '+1 (555) 012-3456', lastSeenDate: '2023-09-24', dateNoticed: '2023-10-08', weeksAbsent: 4, reason: 'Travel', priority: Priority.MEDIUM, status: 'Recorded', notes: 'Frequent traveler, usually returns after a month.' },
  { id: '2', memberName: 'Alice Thompson', phone: '+1 (555) 987-6543', lastSeenDate: '2023-10-01', dateNoticed: '2023-10-22', weeksAbsent: 3, priority: Priority.HIGH, status: 'Contacted', notes: 'Has been sick. Needs follow up call on Friday.' },
];

export const mockAnnouncements: Announcement[] = [
  { id: '1', type: 'Announcement', title: 'Youth Retreat', description: 'Upcoming retreat in November.', category: 'Youth Ministry', urgency: 'Needed Soon', status: 'Approved', submittedBy: 'Sarah Smith', createdAt: '2023-10-20T10:00:00Z' },
  { id: '2', type: 'Maintenance', title: 'Broken Window', description: 'Window in hall 2 needs repair.', category: 'Facility', urgency: 'Urgent', status: 'Submitted', submittedBy: 'John Doe', createdAt: '2023-10-24T15:00:00Z' },
];

export const mockAssets: Asset[] = [
  { id: '1', name: 'Plastic Chairs', category: 'Furniture', totalQuantity: 500, goodCondition: 450, manageable: 40, discarded: 10, location: 'Sanctuary', value: 2500 },
  { id: '2', name: 'Sound Mixer', category: 'Audio/Visual', totalQuantity: 1, goodCondition: 1, manageable: 0, discarded: 0, location: 'Sound Booth', value: 1200 },
  { id: '3', name: 'Projectors', category: 'Audio/Visual', totalQuantity: 2, goodCondition: 2, manageable: 0, discarded: 0, location: 'Sanctuary', value: 800 },
];

export const mockComplaints: Complaint[] = [
  { id: '1', category: 'Facility Issues', title: 'AC Leaking', description: 'The AC unit in the choir section is leaking water.', priority: Priority.HIGH, status: 'Open', submittedBy: 'John Doe', createdAt: '2023-10-24T12:00:00Z' },
  { id: '2', category: 'Parking', title: 'Crowded Parking', description: 'Cars were parked blocking the exit.', priority: Priority.MEDIUM, status: 'Resolved', submittedBy: 'Sarah Smith', createdAt: '2023-10-22T09:00:00Z' },
];

export const mockMembers: Member[] = [
  { id: '1', fullName: 'John Doe', gender: Gender.MALE, birthday: '1990-01-01', phone: '+1234567890', email: 'john@gracecenter.com', location: 'Downtown', branch: 'Main Sanctuary', category: 'Member', customTags: [], parentIds: [], childrenIds: [], membershipDate: '2023-01-01', followUpNeeded: false, createdAt: '2023-01-01T00:00:00Z' },
  { id: '2', fullName: 'Jane Doe', gender: Gender.FEMALE, birthday: '1992-05-15', phone: '+1122334455', email: 'jane@gracecenter.com', location: 'Uptown', branch: 'Main Sanctuary', category: 'Member', customTags: [], parentIds: [], childrenIds: [], membershipDate: '2023-05-10', followUpNeeded: true, createdAt: '2023-05-10T00:00:00Z' },
];

export const mockEvents: ChurchEvent[] = [
  { id: '1', title: 'Sunday Service', description: 'Weekly worship service.', date: '2023-10-29', time: '09:00', location: 'Main Sanctuary', category: 'Service', createdAt: '2023-10-20T00:00:00Z' },
  { id: '2', title: 'Youth Meeting', description: 'Weekly youth gathering.', date: '2023-10-28', time: '17:00', location: 'Youth Hall', category: 'Meeting', createdAt: '2023-10-20T00:00:00Z' },
];

export const mockReminders: FollowUpReminder[] = [
  { id: '1', firstTimerId: '1', firstTimerName: 'Michael Brown', assignedTo: 'John Doe', date: '2023-10-25', time: '10:00', type: ReminderType.CALL, status: 'Pending' },
];
