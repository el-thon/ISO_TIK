import * as formulirService from './formulirService'

// Legacy compatibility layer. Prefer importing from formulirService in new code.
export const listTopics = formulirService.listFormulirs
export const getTopic = formulirService.getFormulir
export const getTopicLabels = formulirService.getFormulirLabels
export const getTopicInputItems = formulirService.getFormulirInputItems
export const attachTopicLabel = formulirService.attachFormulirLabel
export const detachTopicLabel = formulirService.detachFormulirLabel
export const createTopic = formulirService.createFormulir
export const updateTopic = formulirService.updateFormulir
export const deleteTopic = formulirService.deleteFormulir
export const publishTopic = formulirService.publishFormulir
export const approveTopic = formulirService.approveFormulir
export const requestChanges = formulirService.requestChanges
export const closeTopic = formulirService.closeFormulir
export const reopenTopic = formulirService.reopenFormulir
export const restoreTopic = formulirService.restoreFormulir
export const freezeTopic = formulirService.freezeFormulir
export const unfreezeTopic = formulirService.unfreezeFormulir
export const getTopicTimeline = formulirService.getFormulirTimeline
export const getTopicReviews = formulirService.getFormulirReviews
export const createTopicReview = formulirService.createFormulirReview
export const updateTopicReview = formulirService.updateFormulirReview
export const deleteTopicReview = formulirService.deleteFormulirReview
export const getTopicVersions = formulirService.getFormulirVersions
export const getTopicVersion = formulirService.getFormulirVersion
export const revertTopicVersion = formulirService.revertFormulirVersion
export const uploadInputItemAttachment = formulirService.uploadInputItemAttachment
export const updateInputItem = formulirService.updateInputItem
export const createInputItem = formulirService.createInputItem
export const getCommentById = formulirService.getCommentById
export const replyToComment = formulirService.replyToComment
export const uploadCommentAttachment = formulirService.uploadCommentAttachment
export const getAttachment = formulirService.getAttachment
export const getAttachmentDownloadInfo = formulirService.getAttachmentDownloadInfo
export const getAttachmentDownloadUrl = formulirService.getAttachmentDownloadUrl
export const downloadAttachment = formulirService.downloadAttachment
export const createAttachment = formulirService.createAttachment
export const listAttachments = formulirService.listAttachments
export const uploadAttachment = formulirService.uploadAttachment

export const refreshTopicInputItems = async (formulirId, queryClient) => {
  if (!formulirId || !queryClient) return
  await formulirService.refreshFormulirInputItems(formulirId, queryClient)
  await queryClient.invalidateQueries({ queryKey: ['topics', formulirId, 'input-items'] })
}

export default {
  listTopics,
  getTopic,
  getTopicLabels,
  getTopicInputItems,
  attachTopicLabel,
  detachTopicLabel,
  createTopic,
  updateTopic,
  uploadInputItemAttachment,
  updateInputItem,
  createInputItem,
  deleteTopic,
  publishTopic,
  approveTopic,
  requestChanges,
  closeTopic,
  reopenTopic,
  restoreTopic,
  freezeTopic,
  unfreezeTopic,
  getTopicTimeline,
  getTopicReviews,
  createTopicReview,
  updateTopicReview,
  deleteTopicReview,
  getCommentById,
  replyToComment,
  uploadCommentAttachment,
  getAttachment,
  getAttachmentDownloadInfo,
  getAttachmentDownloadUrl,
  downloadAttachment,
  getTopicVersions,
  getTopicVersion,
  revertTopicVersion,
  refreshTopicInputItems,
  createAttachment,
  listAttachments,
  uploadAttachment,
}
