export interface Project {
  id: string;
  name: string;
  type: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  progress: number;
  progressStatus?: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
  villasCount: number;
  alertsCount: number;
  picProject?: string; // URL or path to the project image
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Villa {
  id: string;
  projectId: string;
  name: string;
  type: string;
  surface: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progressStatus?: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
  categoriesCount: number;
  tasksCount: number;
  lastModified: Date;
}

export interface Category {
  id: string;
  villaId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'ON_SCHEDULE' | 'IN_PROGRESS' | 'WARNING' | 'DELAYED';
  progressStatus?: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
  teamId?: string;
  tasksCount: number;
  completedTasks: number;
}

export interface Team {
  id: string;
  name: string;
  specialty: string;
  membersCount: number;
  activeTasks: number;
  performance: number;
  lastActivity: Date;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  durationDays?: number;
  defaultAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  templateId?: string; // Reference to TaskTemplate
  categoryId: string;
  villaId: string;
  name: string;
  description?: string;
  teamId?: string;
  startDate: Date;
  endDate: Date;
  plannedStartDate: Date;
  plannedEndDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  progressStatus: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
  isReceived: boolean;
  isPaid: boolean;
  amount?: number;
  photos: string[];
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: 'deadline' | 'delay' | 'unreceived' | 'unpaid' | 'team_inactive';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
  projectId?: string;
  villaId?: string;
  taskId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_leader' | 'worker';
  avatar?: string;
  createdAt: Date;
  isActive: boolean;
  phone?: string;
  lastLogin?: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  categories: {
    name: string;
    startDate?: Date;
    endDate?: Date;
    tasks: {
      name: string;
      description?: string;
      teamId?: string;
      durationDays?: number;
      amount?: number;
      plannedStartDate?: Date;
      plannedEndDate?: Date;
      actualStartDate?: Date;
      actualEndDate?: Date;
      progress?: number;
      progressStatus?: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
      status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
      isReceived?: boolean;
      isPaid?: boolean;
      remarks?: string;
    }[];
  }[];
  createdAt: Date;
}