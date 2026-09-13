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

export { promoteFromWaitlist } from './shared/waitlist.js';
export { findScheduleConflict, doIntervalsOverlap } from './shared/scheduleConflict.js';
