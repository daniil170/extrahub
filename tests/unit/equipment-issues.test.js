import { describe, it, expect, beforeEach } from 'vitest';
import {
  fetchEquipmentIssues,
  fetchIssueById,
  createEquipmentIssueRecord,
  updateIssueStatusRecord,
  addIssueCommentRecord,
  fetchIssueComments,
  resetEquipmentIssuesStore,
} from '../../src/features/equipment/api.js';
import {
  createEquipmentIssue,
  createIssueComment,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_CATEGORIES,
} from '../../src/entities/equipmentIssue/model.js';
import {
  fetchUserNotifications,
  resetNotificationsStore,
} from '../../src/features/notifications/api.js';

describe('Equipment Maintenance Module — Unit Tests', () => {
  beforeEach(() => {
    resetEquipmentIssuesStore();
    resetNotificationsStore();
  });

  describe('Entity Models & Factories', () => {
    it('creates an EquipmentIssue entity with default values', () => {
      const issue = createEquipmentIssue({
        title: 'Сломан стул',
        location: 'Кабинет 101',
      });

      expect(issue.id).toBeDefined();
      expect(issue.title).toBe('Сломан стул');
      expect(issue.location).toBe('Кабинет 101');
      expect(issue.category).toBe('other');
      expect(issue.priority).toBe('medium');
      expect(issue.status).toBe('new');
      expect(issue.assignedTo).toBeNull();
      expect(issue.resolvedAt).toBeNull();
      expect(issue.createdAt).toBeDefined();
    });

    it('creates an IssueComment entity with author metadata', () => {
      const comment = createIssueComment({
        issueId: 'issue-1',
        authorId: 'teacher-1',
        authorName: 'Аскаров Д. С.',
        authorRole: 'teacher',
        text: 'Просьба прийти до начала урока.',
      });

      expect(comment.id).toBeDefined();
      expect(comment.issueId).toBe('issue-1');
      expect(comment.authorId).toBe('teacher-1');
      expect(comment.text).toBe('Просьба прийти до начала урока.');
      expect(comment.createdAt).toBeDefined();
    });
  });

  describe('Issue Creation and Priority Sorting', () => {
    it('creates an issue and dispatches urgent notification for critical priority', async () => {
      const newIssue = await createEquipmentIssueRecord({
        title: 'Утечка газа в столовой',
        description: 'Чувствуется резкий запах газа возле кухонной плиты.',
        location: 'Пищеблок столовой',
        category: ISSUE_CATEGORIES.OTHER,
        priority: ISSUE_PRIORITIES.CRITICAL,
        reportedBy: 'teacher-1',
        reportedByName: 'Аскаров Данияр Серикович',
      });

      expect(newIssue.id).toBeDefined();
      expect(newIssue.status).toBe('new');
      expect(newIssue.priority).toBe('critical');

      // Verify technician received notification marked urgent
      const techNotifs = await fetchUserNotifications('technician-1', 'technician');
      const urgentNotif = techNotifs.find((n) => n.text.includes('Пищеблок столовой'));
      expect(urgentNotif).toBeDefined();
      expect(urgentNotif.title).toContain('СРОЧНО');
    });

    it('sorts issues with critical priority first', async () => {
      const issues = await fetchEquipmentIssues({ role: 'technician' });
      expect(issues.length).toBeGreaterThan(0);

      // The first issues must have critical priority
      const firstIssue = issues[0];
      expect(firstIssue.priority).toBe('critical');
    });
  });

  describe('Role-based Visibility', () => {
    it('filters issues for teacher role so they only see their own reported issues', async () => {
      const teacherIssues = await fetchEquipmentIssues({
        role: 'teacher',
        userId: 'teacher-1',
      });

      expect(teacherIssues.length).toBeGreaterThan(0);
      teacherIssues.forEach((issue) => {
        expect(issue.reportedBy).toBe('teacher-1');
      });
    });

    it('returns all school issues for technician and admin roles', async () => {
      const techIssues = await fetchEquipmentIssues({
        role: 'technician',
        userId: 'technician-1',
      });

      const reportedBySet = new Set(techIssues.map((i) => i.reportedBy));
      expect(reportedBySet.size).toBeGreaterThan(1);
    });
  });

  describe('Workflow State Transitions & Notifications', () => {
    it('allows technician to take a new issue into work', async () => {
      const res = await updateIssueStatusRecord({
        issueId: 'issue-1',
        status: 'in_progress',
        currentUser: {
          id: 'technician-1',
          fullName: 'Серикбаев Болат Маратович',
          role: 'technician',
        },
      });

      expect(res.success).toBe(true);
      const updated = await fetchIssueById('issue-1');
      expect(updated.status).toBe('in_progress');
      expect(updated.assignedTo).toBe('technician-1');
      expect(updated.assignedToName).toBe('Серикбаев Болат Маратович');

      // Check notification sent to teacher-1
      const teacherNotifs = await fetchUserNotifications('teacher-1', 'teacher');
      const takenNotif = teacherNotifs.find((n) => n.type === 'equipment_issue_in_progress');
      expect(takenNotif).toBeDefined();
      expect(takenNotif.title).toContain('Заявка взята в работу');
    });

    it('allows technician to resolve an issue with mandatory resolution comment', async () => {
      const res = await updateIssueStatusRecord({
        issueId: 'issue-2',
        status: 'resolved',
        resolutionComment: 'Заменен вентиль радиатора отопления, течь устранена.',
        currentUser: {
          id: 'technician-1',
          fullName: 'Серикбаев Болат Маратович',
          role: 'technician',
        },
      });

      expect(res.success).toBe(true);
      const updated = await fetchIssueById('issue-2');
      expect(updated.status).toBe('resolved');
      expect(updated.resolutionComment).toBe('Заменен вентиль радиатора отопления, течь устранена.');
      expect(updated.resolvedAt).toBeDefined();

      // Check notification sent to teacher-1
      const teacherNotifs = await fetchUserNotifications('teacher-1', 'teacher');
      const resolvedNotif = teacherNotifs.find((n) => n.type === 'equipment_issue_resolved');
      expect(resolvedNotif).toBeDefined();
      expect(resolvedNotif.text).toContain('Заменен вентиль радиатора');
    });

    it('allows teacher to cancel their own issue', async () => {
      const res = await updateIssueStatusRecord({
        issueId: 'issue-3',
        status: 'cancelled',
        resolutionComment: 'Проблема решилась заменой батареек в пульте',
        currentUser: {
          id: 'teacher-1',
          fullName: 'Аскаров Данияр Серикович',
          role: 'teacher',
        },
      });

      expect(res.success).toBe(true);
      const updated = await fetchIssueById('issue-3');
      expect(updated.status).toBe('cancelled');
    });
  });

  describe('Issue Discussion Comments', () => {
    it('appends comments and notifies opposing party', async () => {
      const comment = await addIssueCommentRecord({
        issueId: 'issue-2',
        text: 'Подскажите, удалось ли перекрыть стояк?',
        currentUser: {
          id: 'teacher-1',
          fullName: 'Аскаров Данияр Серикович',
          role: 'teacher',
        },
      });

      expect(comment.id).toBeDefined();
      expect(comment.text).toBe('Подскажите, удалось ли перекрыть стояк?');

      const allComments = await fetchIssueComments('issue-2');
      expect(allComments.some((c) => c.text === 'Подскажите, удалось ли перекрыть стояк?')).toBe(true);

      // Verify technician received notification about comment
      const techNotifs = await fetchUserNotifications('technician-1', 'technician');
      const commentNotif = techNotifs.find((n) => n.type === 'equipment_comment');
      expect(commentNotif).toBeDefined();
    });
  });
});
