/**
 * ExtraHub Cloud Functions v2
 * Entry point for callable and scheduled background services
 */

export { createEnrollment } from './callable/createEnrollment.js';
export { approveEnrollment } from './callable/approveEnrollment.js';
export { rejectEnrollment } from './callable/rejectEnrollment.js';
export { cancelEnrollment } from './callable/cancelEnrollment.js';
export { getInviteDetails } from './callable/getInviteDetails.js';
export { expireHoldsScheduled, processExpiredHolds } from './scheduled/expireHolds.js';

export { createEquipmentIssue } from './callable/createEquipmentIssue.js';
export { updateIssueStatus } from './callable/updateIssueStatus.js';
export { addIssueComment } from './callable/addIssueComment.js';

export { createStaffInvite } from './callable/createStaffInvite.js';
export { registerViaInvite } from './callable/registerViaInvite.js';
export { registerStudent } from './callable/registerStudent.js';
export { switchDemoRole } from './callable/switchDemoRole.js';
export { logClientAudit } from './callable/logClientAudit.js';

export { recordAttendance } from './callable/recordAttendance.js';
export { awardSpecialRecognition } from './callable/awardSpecialRecognition.js';
export { useStreakFreeze } from './callable/useStreakFreeze.js';
export { gradeExamApplication } from './callable/gradeExamApplication.js';

export { createSeason } from './callable/createSeason.js';
export { finalizeSeasonAndPromote } from './callable/finalizeSeasonAndPromote.js';
export { updateLeagueProfile } from './callable/updateLeagueProfile.js';

export { logAuditEvent } from './shared/auditLog.js';
export { logFunctionError } from './shared/systemErrors.js';
export { promoteFromWaitlist } from './shared/waitlist.js';
export { findScheduleConflict, doIntervalsOverlap } from './shared/scheduleConflict.js';
export {
  awardPoints,
  calculateStreakMultiplier,
  getCurrentQuarterKey,
  GAMIFICATION_CONFIG,
} from './shared/gamification.js';
export {
  getActiveSeason,
  incrementSeasonalLeagueXP,
  shuffleArray,
  splitIntoGroups,
  getNextRank,
  LEAGUE_CONSTANTS,
} from './shared/leagues.js';

