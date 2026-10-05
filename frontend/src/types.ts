import type { MouseEvent } from 'react';

interface UserContextType {
  authenticatedUser: MaybeAuthenticatedUser;
  setAuthenticatedUser?: (user: MaybeAuthenticatedUser) => void;
  registerUser: (newUser: UserRegister) => Promise<void>;
  loginUser: (user: User, rememberMe: boolean) => Promise<void>;
  clearUser: () => void;
  jwtData: () => JwtPayload | null;
  refreshUser: () => Promise<void>;
}

interface User {
  email: string;
  password: string;
}

interface UserProfile {
  id: number;
  email: string;
  tag: string;
  speciality: string;
  profilePicture: string;
  date: string;
}

interface UserRegister {
  email: string;
  password: string;
  tag: string;
  speciality: string;
  profile_picture: string;
}

interface AuthenticatedUser {
  id: number;
  email: string;
  tag: string;
  token: string;
  teamId?: number;
}

interface TeamUser {
  id: number;
}
interface JwtPayload {
  id: number;
  email: string;
  isAdmin: boolean;
}

type MaybeAuthenticatedUser = AuthenticatedUser | undefined;

interface TeamMemberRow {
  membershipId?: number;
  member: TeamUserProfile;
  roleLabel: string;
}

interface TeamsListContextType {
  teams: Team[];
  sortedTeams: Team[];
  currentTeamId: number | undefined;
  currentMembership: TeamMembership | null;
  loading: boolean;
  error: string | null;
  createError: string | null;
  joinError: string | null;
  newTeamName: string;
  acceptManagerRole: boolean;
  creating: boolean;
  showJoinColumn: boolean;
  helpText: string;
  setNewTeamName: (name: string) => void;
  setAcceptManagerRole: (value: boolean) => void;
  clearError: () => void;
  clearCreateError: () => void;
  clearJoinError: () => void;
  handleCreateTeam: () => Promise<void>;
  handleJoinTeam: (teamId: number) => Promise<void>;
}

interface TeamDetailsContextType {
  team: Team | null;
  memberships: TeamMembership[];
  memberList: TeamMemberRow[];
  totalTeamMembers: number;
  isPrimaryManager: boolean;
  isSecondManager: boolean;
  canViewMemberEmail: boolean;
  currentUserId: number | undefined;
  loading: boolean;
  error: string | null;
  success: string | null;
  actionLoading: string | null;
  clearError: () => void;
  clearSuccess: () => void;
  handleRefresh: () => void;
  teamActivity: TeamActivity[];
  pastActivity: TeamActivity[];
  ongoingActivity: TeamActivity[];
  futureActivity: TeamActivity[];
  handleDesignateSecondManager: (memberId: number) => Promise<void>;
  handleLeaveTeam: () => Promise<void>;
  handleExcludeMember: (membershipId: number) => Promise<void>;
}

interface ProfileContextType {
  profile: Profile | null;
  specialties: string[];
  unavailabilities: Unavailability[];
  avatarOptions: AvatarOption[];
  loading: boolean;
  error: string | null;
  openPasswordModal: boolean;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  passwordSuccess: string;
  openUnavailModal: boolean;
  startDate: string;
  endDate: string;
  unavailError: string;
  openSpecialityModal: boolean;
  newSpeciality: string;
  specialityError: string;
  openPictureModal: boolean;
  selectedAvatarSrc: string;
  pictureError: string;
  setOpenPasswordModal: (open: boolean) => void;
  setOldPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handlePasswordUpdate: () => Promise<void>;
  setOpenUnavailModal: (open: boolean) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  handleAddUnavailability: () => Promise<void>;
  setOpenSpecialityModal: (open: boolean) => void;
  setNewSpeciality: (value: string) => void;
  handleUpdateSpeciality: () => Promise<void>;
  setOpenPictureModal: (open: boolean) => void;
  setSelectedAvatarSrc: (value: string) => void;
  handleUpdatePicture: () => Promise<void>;
}

interface AdministrationContextType {
  loading: boolean;
  error: string | null;
  administrationList: UserProfile[] | null;
  nonAdmins: UserProfile[];
  openPromoteModal: boolean;
  selectedUserId: number | '';
  promoteError: string;
  demoteError: string;
  currentUserId?: number;
  refreshAdministrators: () => Promise<void>;
  openPromoteModalAndLoadUsers: () => Promise<void>;
  closePromoteModal: () => void;
  setSelectedUserId: (userId: number | '') => void;
  promoteSelectedUser: () => Promise<void>;
  demoteUser: (userId: number) => Promise<void>;
}

interface RegisterContextType {
  email: string;
  password: string;
  tag: string;
  specialty: string;
  specialties: string[];
  avatarOptions: AvatarOption[];
  selectedAvatarId: string;
  isPasswordVisible: boolean;
  successMessage: string;
  errorMessage: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setTag: (tag: string) => void;
  setSpecialty: (specialty: string) => void;
  setSelectedAvatarId: (selectedAvatarId: string) => void;
  togglePasswordVisibility: () => void;
  submitRegistration: () => Promise<void>;
}

interface Notification {
  notificationId: number;
  object: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  type: 'WELCOME' | 'TEAM_INVITATION' | 'GENERAL';
  membershipId?: number;
}

interface TeamUserProfile {
  id: number;
  email: string;
  tag: string;
  speciality: string;
  profilePicture: string;
  date: string;
}

interface Team {
  id: number;
  name: string;
  manager?: TeamUserProfile | null;
  secondManager?: TeamUserProfile | null;
  managersCount: number;
  membersCount: number;
}

interface TeamMembership {
  id: number;
  member: TeamUserProfile;
  team: Team;
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED';
  rejectionReason?: string;
}

interface Profile {
  id: number;
  email: string;
  tag: string;
  speciality: string;
  teamName?: string;
  teamId?: number;
  profilePicture: string;
  date: string;
  isManager?: boolean;
  isAdmin: boolean;
}

interface MembersContextType {
  loading: boolean;
  error: string | null;
  membersList: UserPublicProfile[] | null;
  filteredMembers: UserPublicProfile[];
  search: string;
  currentUserId: number | undefined;
  setSearch: (value: string) => void;
  refreshMembers: () => Promise<void>;
}

interface MemberDetailsContextType {
  loading: boolean;
  error: string | null;
  member: UserPublicProfile | null;
  unavailabilities: Unavailability[];
  canViewUnavailabilities: boolean;
  openBanModal: boolean;
  banError: string;
  setOpenBanModal: (open: boolean) => void;
  handleBanMember: () => Promise<void>;
}

interface UserPublicProfile {
  id: number;
  tag: string;
  speciality: string;
  profilePicture: string;
  date: string;
  teamName: string | null;
  teamId: number | null;
  isBanned: boolean;
}

interface Tournament {
  id: number;
  name: string;
  description: string;
  state: string;
  stateDisplayName: string;
  startDate: string;
  endDate: string;
  startInscriptionDate: string;
  endInscriptionDate: string;
  maxTeams: number;
  registrationsCount: number;
  winner?: string;
}

interface TeamActivity {
  tournamentId: number;
  tournamentName: string;
  startDate: string;
  endDate: string;
}

interface TournamentRegistration {
  tournamentId: number;
  tournamentName: string;
  teamId: number;
  teamName: string;
}

interface Match {
  matchId: number;
  round: number;
  totalRounds?: number;
  startTime: string;
  state: string;
  team1Name?: string;
  team1Id?: number;
  team2Name?: string;
  team2Id?: number;
  byeTeamId?: number;
  team1Score?: number;
  team2Score?: number;
  adminId?: number;
  tournamentId?: number;
  tournamentName?: string;
  scoreUpdatedAt?: string;
  team1MotifRefuse?: string;
  team2MotifRefuse?: string;
  groupedFromBye?: boolean;
  team1Forfeit?: boolean;
  team2Forfeit?: boolean;
}

interface ScheduleBracketProps {
  matches: Match[];
  onSuccess: () => void;
  tournamentId: number;
  currentTeamId?: number;
  isAdmin?: boolean;
}

interface SideColumnLayout {
  round: number;
  matches: Match[];
  x: number;
  yPositions: number[];
}

interface TournamentDetailsContextType {
  tournament: Tournament | null;
  registrations: TournamentRegistration[];
  loading: boolean;
  error: string | null;
  success: string | null;
  actionLoading: string | null;
  canRegister: boolean;
  registering: boolean;
  registerError: string | null;
  registerSuccess: boolean;
  isAdmin: boolean;
  currentUserId: number | undefined;
  alreadyRegistered: boolean;
  refreshRegistrations: () => Promise<void>;
  registerTeam: () => Promise<void>;
  clearRegisterError: () => void;
  clearError: () => void;
  clearSuccess: () => void;
  handleRefresh: () => void;
  handlePublishTournament: (payload: PublishTournamentPayload) => Promise<void>;
}

type CreateTournamentPayload = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startInscriptionDate: string;
  endInscriptionDate: string;
  maxTeams: number;
};

type PublishTournamentPayload = CreateTournamentPayload & {
  state: string;
};

interface TournamentContextType {
  loading: boolean;
  error: string | null;
  tournamentList: Tournament[] | null;
  filteredTournaments: Tournament[];
  helpText: string;
  isAdmin: boolean;
  today: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startInscriptionDate: string;
  endInscriptionDate: string;
  maxTeams: string;
  submitting: boolean;
  formError: string | null;
  formSuccess: string | null;
  publishing: boolean;
  publishError: string | null;
  publishSuccess: string | null;
  editing: boolean;
  editError: string | null;
  editSuccess: string | null;
  generating: boolean;
  generateError: string | null;
  generateSuccess: string | null;
  refreshTournaments: () => Promise<void>;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setStartInscriptionDate: (value: string) => void;
  setEndInscriptionDate: (value: string) => void;
  setMaxTeams: (value: string) => void;
  submitTournamentCreation: () => Promise<void>;
  handlePublishTournament: (
    tournamentId: number,
    payload: PublishTournamentPayload,
  ) => Promise<void>;
  handleEditTournament: (
    tournament: Tournament,
    payload: CreateTournamentPayload,
  ) => Promise<void>;
  handleGenerateSchedule: (tournamentId: number) => Promise<void>;
  // Filters — client-side
  stateFilter: string | null;
  yearFilter: number | null;
  monthFilter: number | null;
  tournamentNameFilter: string;
  dayOfWeekFilter: number | null;
  durationFilter: number | null;
  availabilityFilter: 'available' | 'unavailable' | null;
  fromDateFilter: string;
  toDateFilter: string;
  // Filters — server-side (debounced)
  teamNameFilter: string;
  playerTagFilter: string;
  // Registered tournaments for current user's team
  registeredTournamentIds: Set<number>;
  // Tournaments where current user was selected in a match
  participatedTournamentIds: Set<number>;
  // Setters
  setStateFilter: (value: string | null) => void;
  setYearFilter: (value: number | null) => void;
  setMonthFilter: (value: number | null) => void;
  setTournamentNameFilter: (value: string) => void;
  setDayOfWeekFilter: (value: number | null) => void;
  setDurationFilter: (value: number | null) => void;
  setAvailabilityFilter: (value: 'available' | 'unavailable' | null) => void;
  setFromDateFilter: (value: string) => void;
  setToDateFilter: (value: string) => void;
  setTeamNameFilter: (value: string) => void;
  setPlayerTagFilter: (value: string) => void;
  resetFilters: () => void;
  // Derived — impossible combos and active state
  hasActiveFilters: boolean;
  isTeamNameDisabled: boolean;
  isPlayerTagDisabled: boolean;
  isAvailableOptionDisabled: boolean;
  isYearIncompatibleWithState: boolean;
  isMonthIncompatibleWithState: boolean;
  disabledMonths: Set<number>;
}

type TournamentCreationContextType = TournamentContextType;

interface Unavailability {
  id: number;
  startDate: string;
  endDate: string;
}

interface SelectionMatch {
  matchId: number;
  teamId: number;
  memberId: number;
  memberTag: string;
  memberSpeciality: string;
}

interface ParticipationMatch {
  matchId: number;
  teamId: number;
  statusSelection: number;
  score?: number | null;
}

interface SelectionContextType {
  match: Match | null;
  memberships: TeamMembership[];
  selections: SelectionMatch[];
  statusSelection: number;
  unavailableMemberIds: Set<number>;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  isSelected: (memberId: number) => boolean;
  canModify: boolean;
  handleToggle: (memberId: number) => Promise<void>;
  clearActionError: () => void;
}

interface AvatarOption {
  id: string;
  label: string;
  src: string;
}

interface NavbarContextType {
  isAdmin: boolean;
  displayName: string;
  profilePictureUrl: string;
  hasUnread: boolean;
  menuAnchor: HTMLElement | null;
  openProfileMenu: (event: MouseEvent<HTMLElement>) => void;
  closeProfileMenu: () => void;
}

interface MatchDetailContextType {
  match: Match | null;
  team1: Team | null;
  team2: Team | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  matchEnded: boolean;
  isManagerOfAnyTeam: boolean;
  canSeeTeam1: boolean;
  canSeeTeam2: boolean;
}

type HomePageContextType = {
  tournaments: Tournament[] | null;
  loading: boolean;
  error: string | null;
};

type NotificationContextType = {
  notifications: Notification[];
  error: string | null;
  decidedIds: Set<number>;
  markAsRead: (id: number) => Promise<void>;
  handleAccept: (membershipId: number, notificationId: number) => Promise<void>;
  handleDecline: (
    declineId: number,
    declineNotificationId: number,
    reason: string,
  ) => Promise<string | null>;
};

export type {
  NavbarContextType,
  User,
  UserProfile,
  UserRegister,
  AuthenticatedUser,
  MaybeAuthenticatedUser,
  TeamMemberRow,
  TeamsListContextType,
  TeamDetailsContextType,
  ProfileContextType,
  AdministrationContextType,
  RegisterContextType,
  UserContextType,
  JwtPayload,
  Notification,
  TeamUserProfile,
  Team,
  TeamUser,
  TeamMembership,
  Profile,
  Tournament,
  TournamentRegistration,
  Match,
  ScheduleBracketProps,
  SideColumnLayout,
  CreateTournamentPayload,
  PublishTournamentPayload,
  TournamentContextType,
  TournamentCreationContextType,
  TournamentDetailsContextType,
  Unavailability,
  SelectionMatch,
  SelectionContextType,
  ParticipationMatch,
  AvatarOption,
  UserPublicProfile,
  MembersContextType,
  MemberDetailsContextType,
  TeamActivity,
  MatchDetailContextType,
  HomePageContextType,
  NotificationContextType,
};
