/**
 * @typedef {'furniture' | 'hardware' | 'plumbing' | 'electrical' | 'other'} IssueCategory
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} IssuePriority
 */

/**
 * @typedef {'new' | 'in_progress' | 'resolved' | 'cancelled'} IssueStatus
 */

/**
 * @typedef {Object} EquipmentIssue
 * @property {string} id - Unique issue identifier
 * @property {string} title - Short summary of the breakdown
 * @property {string} description - Detailed description
 * @property {string} location - Room number or premises (e.g. "Кабинет 304", "Спортзал")
 * @property {IssueCategory} category - Equipment category
 * @property {IssuePriority} priority - Urgency level
 * @property {IssueStatus} status - Lifecycle status
 * @property {string} reportedBy - Teacher user ID who filed the issue
 * @property {string} [reportedByName] - Name of reporting teacher
 * @property {string|null} assignedTo - Technician user ID handling the issue
 * @property {string|null} [assignedToName] - Name of assigned technician
 * @property {string|null} [photoUrl] - Optional photo URL / data preview
 * @property {string} createdAt - ISO date string
 * @property {string} updatedAt - ISO date string
 * @property {string|null} [resolvedAt] - ISO date string when resolved
 * @property {string|null} [resolutionComment] - Technician resolution notes
 */

/**
 * @typedef {Object} IssueComment
 * @property {string} id - Unique comment identifier
 * @property {string} issueId - Associated issue ID
 * @property {string} authorId - Author user ID
 * @property {string} authorName - Author display name
 * @property {string} authorRole - Author role ('teacher' | 'technician' | 'admin')
 * @property {string} text - Message body
 * @property {string} createdAt - ISO date string
 */

/**
 * Factory function to create an EquipmentIssue entity
 * @param {Partial<EquipmentIssue>} data
 * @returns {EquipmentIssue}
 */
export function createEquipmentIssue(data = {}) {
  const now = new Date().toISOString();
  return {
    id: data.id || '',
    title: data.title || '',
    description: data.description || '',
    location: data.location || '',
    category: data.category || 'other',
    priority: data.priority || 'medium',
    status: data.status || 'new',
    reportedBy: data.reportedBy || '',
    reportedByName: data.reportedByName || '',
    assignedTo: data.assignedTo || null,
    assignedToName: data.assignedToName || null,
    photoUrl: data.photoUrl || null,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    resolvedAt: data.resolvedAt || null,
    resolutionComment: data.resolutionComment || null,
  };
}

/**
 * Factory function to create an IssueComment entity
 * @param {Partial<IssueComment>} data
 * @returns {IssueComment}
 */
export function createIssueComment(data = {}) {
  return {
    id: data.id || '',
    issueId: data.issueId || '',
    authorId: data.authorId || '',
    authorName: data.authorName || '',
    authorRole: data.authorRole || 'teacher',
    text: data.text || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export const ISSUE_CATEGORIES = {
  FURNITURE: 'furniture',
  HARDWARE: 'hardware',
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  OTHER: 'other',
};

export const ISSUE_CATEGORY_META = {
  furniture: { label: 'Мебель' },
  hardware: { label: 'Техника и ПК' },
  plumbing: { label: 'Сантехника' },
  electrical: { label: 'Электрика' },
  other: { label: 'Прочее' },
};

export const ISSUE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const ISSUE_PRIORITY_META = {
  low: { label: 'Низкий', color: '#10b981', badgeVariant: 'default' },
  medium: { label: 'Средний', color: '#f59e0b', badgeVariant: 'warning' },
  high: { label: 'Высокий', color: '#f97316', badgeVariant: 'warning' },
  critical: { label: 'Критический', color: '#ef4444', badgeVariant: 'danger' },
};

export const ISSUE_STATUSES = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
};

export const ISSUE_STATUS_META = {
  new: { label: 'Новая', badgeVariant: 'info', color: '#3b82f6' },
  in_progress: { label: 'В работе', badgeVariant: 'warning', color: '#f59e0b' },
  resolved: { label: 'Закрыта', badgeVariant: 'success', color: '#10b981' },
  cancelled: { label: 'Отменена', badgeVariant: 'default', color: '#6b7280' },
};
