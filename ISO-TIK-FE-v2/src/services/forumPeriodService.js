import * as periodService from './periodService'

// Legacy compatibility layer. New code should import from periodService.
export const listForumPeriods = periodService.listPeriods
export const getForumPeriod = periodService.getPeriod
export const createForumPeriod = periodService.createPeriod
export const updateForumPeriod = periodService.updatePeriod
export const listForumPeriodForums = periodService.listPeriodForums
export const createForumPeriodForum = periodService.createPeriodForum
export const updateForumPeriodForum = periodService.updatePeriodForum
export const listForumPeriodForumFormulirs = periodService.listPeriodForumFormulirs
export const listForumPeriodForumTopics = periodService.listPeriodForumFormulirs
export const createForumPeriodForumFormulir = periodService.createPeriodForumFormulir
export const createForumPeriodForumTopic = periodService.createPeriodForumFormulir
export const joinForumPeriodByCode = periodService.joinPeriodByCode
export const listPeriodJoinRequests = periodService.listPeriodJoinRequests
export const getMyPeriodJoinRequest = periodService.getMyPeriodJoinRequest
export const approvePeriodJoinRequest = periodService.approvePeriodJoinRequest
export const rejectPeriodJoinRequest = periodService.rejectPeriodJoinRequest

export default {
  listForumPeriods,
  getForumPeriod,
  createForumPeriod,
  updateForumPeriod,
  listForumPeriodForums,
  createForumPeriodForum,
  updateForumPeriodForum,
  listForumPeriodForumFormulirs,
  listForumPeriodForumTopics,
  createForumPeriodForumFormulir,
  createForumPeriodForumTopic,
  joinForumPeriodByCode,
  listPeriodJoinRequests,
  getMyPeriodJoinRequest,
  approvePeriodJoinRequest,
  rejectPeriodJoinRequest,
}
