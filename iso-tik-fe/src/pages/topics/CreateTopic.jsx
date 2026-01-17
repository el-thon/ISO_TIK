import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GripVertical, Trash2, PlusSquare, UploadCloud, Loader2 } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useRooms } from '@/services/roomHooks'
import { useLabels } from '@/services/labelHooks'
import { useCreateTopic } from '@/services/topicHooks'
import * as topicService from '@/services/topicService'
import { useQuill } from 'react-quilljs'
import 'quill/dist/quill.snow.css'

const securityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'restricted', label: 'Restricted' },
]

const normalizeId = (value) => {
  if (value == null) return undefined
  const numeric = Number(value)
  return Number.isNaN(numeric) ? value : numeric
}

const blockTitle = {
  text: 'Text block',
  richtext: 'Rich text block',
  link: 'Link block',
  image: 'Image block',
  file: 'File block',
  form: 'Form block',
}

const mapBlockTypeToApi = (type) => {
  switch (type) {
    case 'richtext':
      return 'rich_text'
    case 'form':
      return 'form_data'
    case 'text':
    case 'image':
    case 'file':
    case 'link':
      return type
    default:
      return 'text'
  }
}

const mapVisibilityToApi = (block) => {
  if (typeof block.visibility === 'string') return block.visibility
  return block.visible === false ? 'restricted' : 'visible'
}

const stringifyId = (value) => {
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value)
  return null
}

const extractIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = typeof window !== 'undefined' ? new URL(url, window.location.origin) : new URL(url)
    const match = parsed.pathname.match(/topics\/([^/]+)/i)
    return match?.[1] ?? null
  } catch (err) {
    const fallbackMatch = url.match(/topics\/([^/]+)/i)
    return fallbackMatch?.[1] ?? null
  }
}

const findUuidInValue = (value) => {
  if (!value) return null
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  const match = str && str.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
  return match?.[0] ?? null
}

const isLikelyTopicId = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  // Accept UUID-like or numeric IDs
  if (/^[0-9a-fA-F-]{32,40}$/.test(trimmed)) return true
  if (/^\d{1,20}$/.test(trimmed)) return true
  return false
}

const resolveCreatedTopicId = (payload) => {
  if (!payload || typeof payload !== 'object') return null

  const candidates = [
    payload.id,
    payload.topic_id,
    payload.topic_uuid,
    payload.uuid,
    payload.topic?.id,
    payload.topic?.topic_id,
    payload.topic?.uuid,
    payload.data?.id,
    payload.data?.topic_id,
    payload.data?.topic?.id,
    payload.meta?.topic_id,
    payload.result?.id,
    payload.result?.topic_id,
    payload.message?.topic_id,
    payload.message?.id,
    payload.message?.topic?.id,
  ]

  for (const candidate of candidates) {
    const normalized = stringifyId(candidate)
    if (normalized && isLikelyTopicId(normalized)) return normalized
  }

  const linkCandidates = [
    payload.redirect_url,
    payload.topic_url,
    payload.links?.detail,
    payload.links?.self,
    payload.topic?.url,
  ]
  for (const link of linkCandidates) {
    const normalized = extractIdFromUrl(link)
    if (normalized && isLikelyTopicId(normalized)) return normalized
  }

  // Fallback: attempt to find UUID inside message/strings
  const messageUuid = findUuidInValue(payload.message)
  if (messageUuid) return messageUuid

  const rawUuid = findUuidInValue(payload)
  if (rawUuid) return rawUuid

  return null
}

function RichTextEditor({ value, onChange, placeholder = 'Enter rich text content...' }) {
  const { quill, quillRef } = useQuill({ theme: 'snow', placeholder })
  const lastHtml = useRef('')

  useEffect(() => {
    if (quill && typeof value === 'string' && value !== lastHtml.current) {
      lastHtml.current = value
      quill.clipboard.dangerouslyPasteHTML(value || '')
    }
  }, [quill, value])

  useEffect(() => {
    if (!quill) return
    const handler = () => {
      const html = quill.root.innerHTML
      lastHtml.current = html
      onChange?.(html)
    }
    quill.on('text-change', handler)
    return () => {
      quill.off('text-change', handler)
    }
  }, [quill, onChange])

  return <div ref={quillRef} />
}

export default function CreateTopic() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomFromState = location?.state?.roomId ? String(location.state.roomId) : ''
  const roomTitleFromState = location?.state?.roomTitle || null

  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(roomFromState)
  const [selectedLabels, setSelectedLabels] = useState([])
  const [securityLevel, setSecurityLevel] = useState('internal')
  const [deadline, setDeadline] = useState('')
  const [blocks, setBlocks] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Initialize default values
  useEffect(() => {
    if (!selectedRoom && roomFromState) {
      setSelectedRoom(roomFromState)
    }
    if (!securityLevel) {
      setSecurityLevel('internal')
    }
  }, [roomFromState, securityLevel])

  const {
    data: roomsData,
    isLoading: roomsLoading,
    isError: roomsError,
    error: roomsErrorObj,
    refetch: refetchRooms,
  } = useRooms({ per_page: 100 })
  const rooms = roomsData?.rooms ?? []
  const {
    data: labelsData,
    isLoading: labelsLoading,
    isError: labelsError,
    error: labelsErrorObj,
    refetch: refetchLabels,
  } = useLabels()
  const labels = labelsData?.labels ?? []
  const labelsMeta = labelsData?.meta ?? {}
  const labelsSupported = labelsMeta.supported ?? true
  const createTopic = useCreateTopic()
  const isBusy = createTopic.isPending || submitting

  const currentRoomName = useMemo(() => {
    if (selectedRoom) {
      const match = rooms.find((room) => String(room.id) === String(selectedRoom))
      if (match) return match.name
    }
    return roomTitleFromState || '-'
  }, [rooms, selectedRoom, roomTitleFromState])

  const selectedLabelObjects = useMemo(() => {
    if (!selectedLabels.length) return []
    const selection = new Set(selectedLabels.map((value) => String(value)))
    return labels.filter((label) => selection.has(String(label.id)))
  }, [labels, selectedLabels])

  const stepTitles = {
    1: 'Basic Information',
    2: 'Content Blocks',
    3: 'Review & Publish',
  }

  const stepCircleClass = (i) => {
    if (i < step) return 'w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center'
    if (i === step) return 'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center'
    return 'w-8 h-8 rounded-full bg-slate-100 text-muted-foreground flex items-center justify-center'
  }

  const connectorClass = (i) => (i < step ? 'w-24 h-1 bg-emerald-500 rounded-full' : 'w-24 h-1 bg-slate-200 rounded-full')

  const isLabelSelected = (labelId) => selectedLabels.some((value) => String(value) === String(labelId))

  const toggleLabel = (labelId) => {
    if (!labelsSupported) return
    setSelectedLabels((prev) => {
      const key = String(labelId)
      if (prev.some((value) => String(value) === key)) {
        return prev.filter((value) => String(value) !== key)
      }
      return [...prev, key]
    })
  }

  const addBlock = (type) => {
    const id = Date.now().toString()
    const base = {
      id,
      type,
      title: blockTitle[type] || 'New block',
      visible: true,
    }
    switch (type) {
      case 'link':
        setBlocks((prev) => [...prev, { ...base, url: '' }])
        break
      case 'form':
        setBlocks((prev) => [...prev, { ...base, fields: [{ id: `${id}-f-1`, name: '', value: '' }] }])
        break
      case 'image':
      case 'file':
        setBlocks((prev) => [...prev, { ...base, file: null, fileName: '' }])
        break
      default:
        setBlocks((prev) => [...prev, { ...base, content: '' }])
    }
  }

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id))
  }

  const updateBlock = (id, patch) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)))
  }

  const serializeBlocks = () =>
    blocks.map((block, index) => {
      const payload = {
        label: block.title?.trim() || `Konten ${index + 1}`,
        type: mapBlockTypeToApi(block.type),
        order_index: index + 1,
        visibility: mapVisibilityToApi(block),
        value: '',
      }

      if (payload.type === 'link') {
        payload.value = (block.url || '').trim()
      } else if (payload.type === 'form_data') {
        const fields = (block.fields || []).map((field, fieldIdx) => ({
          id: field.id || `${block.id}-field-${fieldIdx + 1}`,
          name: field.name?.trim() || `Field ${fieldIdx + 1}`,
          value: field.value ?? '',
        }))
        payload.metadata = { fields }
        payload.value = ''
      } else if (payload.type === 'image' || payload.type === 'file') {
        payload.value = (block.fileName || '').trim()
        if (block.file) {
          payload.metadata = {
            name: block.file.name,
            size: block.file.size,
            type: block.file.type,
            url: block.fileName || block.file.name,
          }
        }
      } else {
        payload.value = block.content ?? ''
      }

      if (!payload.metadata || Object.keys(payload.metadata).length === 0) delete payload.metadata
      return payload
    })

  const validatePhase1 = () => {
    const validationErrors = {}
    const chosenRoom = selectedRoom || roomFromState || ''
    if (!title.trim()) validationErrors.title = 'Title is required.'
    if (!description.trim()) validationErrors.description = 'Description is required.'
    if (!chosenRoom) validationErrors.room = 'Please select a room.'
    setErrors(validationErrors)
    return { ok: Object.keys(validationErrors).length === 0, chosenRoom }
  }

  const handleNext = () => {
    if (step === 1) {
      const { ok, chosenRoom } = validatePhase1()
      if (!ok) return
      if (chosenRoom) setSelectedRoom(String(chosenRoom))
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
    handleSubmit('publish')
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
    else navigate(-1)
  }

  const buildPayload = (mode, roomId) => {
    const payload = {
      title: title.trim(),
      description: description.trim(),
      security_level: securityLevel || undefined,
      deadline_at: deadline ? new Date(deadline).toISOString() : undefined,
      status: mode === 'publish' ? 'in_review' : 'draft',
    }
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === '') delete payload[key]
    })
    payload.room_id = normalizeId(roomId)
    if (labelsSupported && selectedLabels.length) {
      const labelIds = selectedLabels
        .map((value) => normalizeId(value))
        .filter((value) => value !== undefined && value !== null && value !== '')
      if (labelIds.length) payload.labels = labelIds
    }
    return payload
  }

  const createInputItemsForTopic = async (topicId) => {
    const serialized = serializeBlocks()
    if (!serialized.length) return []

    const createdItems = []

    for (const payload of serialized) {
      try {
        const item = await topicService.createInputItem(topicId, payload)
        createdItems.push(item)
      } catch (error) {
        console.error('Failed to create input item', payload, error)
      }
    }

    // Upload attachments for file/image blocks after items exist
    const uploadableBlocks = blocks
      .map((block, index) => ({ ...block, order_index: index + 1 }))
      .filter((block) => (block.type === 'image' || block.type === 'file') && block.file)

    // Fallback: if no items were returned (API silent), fetch current items
    let itemsForMatch = createdItems
    if (!itemsForMatch.length) {
      try {
        const fetched = await topicService.getTopicInputItems(topicId)
        itemsForMatch = fetched?.items || []
      } catch (error) {
        console.error('Failed to fetch input items for attachments', error)
      }
    }

    const buildAttachmentMetadata = (uploadResult, file) => {
      const att = uploadResult?.attachment || {}

      // Resolve best available URL/path from backend (handles renamed files)
      const resolveUrl = () => {
        const candidates = [
          uploadResult?.url,
          att.download_url,
          att.url,
          att.storage_url,
          att.file_url,
          att.file_path,
          att.filepath,
          att.path,
          att.location,
          att.full_path,
          att.relative_path,
          att.uri,
        ].filter(Boolean)

        for (const raw of candidates) {
          if (typeof raw !== 'string') continue
          const trimmed = raw.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
          if (trimmed.startsWith('/')) return trimmed
          return `/${trimmed}`
        }

        if (att.id) return `/api/v1/attachments/${att.id}/download`
        return null
      }

      const bestUrl = resolveUrl()
      const storageUrl = bestUrl && !bestUrl.startsWith('http') ? bestUrl : att.storage_url || (att.path ? `/${att.path}` : undefined)
      const downloadUrl = bestUrl
      const mime = uploadResult?.type || att.mime_type || file?.type
      const filename = uploadResult?.filename || att.filename || att.original_name || file?.name
      const size = uploadResult?.size || att.size_bytes || att.size || file?.size

      return {
        metadata: {
          attachment_id: att.id,
          name: filename,
          filename,
          size,
          size_bytes: size,
          type: mime,
          mime_type: mime,
          storage_url: storageUrl || undefined,
          download_url: downloadUrl || undefined,
          url: downloadUrl || storageUrl || undefined,
          preview_url: downloadUrl || storageUrl || undefined,
        },
        value: downloadUrl || storageUrl || filename || '',
      }
    }

    for (const block of uploadableBlocks) {
      const matchedItem =
        itemsForMatch.find((item) => {
          const order = item.order_index ?? item.order
          const labelMatches = item.label && block.title && String(item.label).trim() === String(block.title).trim()
          const orderMatches = order && Number(order) === Number(block.order_index)
          return orderMatches || labelMatches
        }) || itemsForMatch[block.order_index - 1]

      const inputItemId = matchedItem?.id || matchedItem?.input_item_id || matchedItem?.uuid
      if (!inputItemId) continue

      try {
        const uploadResult = await topicService.uploadInputItemAttachment(inputItemId, block.file, block.fileName || block.title)

        const meta = buildAttachmentMetadata(uploadResult, block.file)
        if (meta?.metadata) {
          await topicService.updateInputItem(inputItemId, {
            metadata: meta.metadata,
            value: meta.value,
          })
        }
      } catch (error) {
        console.error('Failed to upload attachment for input item', inputItemId, error)
      }
    }

    return createdItems
  }

  const handleSubmit = async (mode) => {
    const { ok, chosenRoom } = validatePhase1()
    if (!ok) {
      setStep(1)
      return
    }
    const payload = buildPayload(mode, chosenRoom)
    setSubmitting(true)
    try {
      const created = await createTopic.mutateAsync({ roomId: normalizeId(chosenRoom), payload })
      const newTopicId = resolveCreatedTopicId(created)
      if (newTopicId) {
        await createInputItemsForTopic(newTopicId)
      }

      if (newTopicId && isLikelyTopicId(newTopicId)) {
        navigate(`/topics/${newTopicId}`)
        return
      }

      if (created?.redirect_url) {
        const redirectId = extractIdFromUrl(created.redirect_url)
        if (redirectId) {
          navigate(`/topics/${redirectId}`)
          return
        }
        navigate(created.redirect_url)
        return
      }

      console.warn('Topic created but ID unavailable in response payload. Redirecting to list.', created)
      navigate('/topics', { state: { refetch: true } })
    } catch (error) {
      console.error('Failed to create topic', error)
      setStep(3)
    } finally {
      setSubmitting(false)
    }
  }

  const mutationMessage = createTopic.error?.response?.data?.message || createTopic.error?.message || ''
  const roomsErrorMessage = roomsErrorObj?.response?.data?.message || roomsErrorObj?.message || ''
  const labelsErrorMessage = useMemo(() => {
    return labelsErrorObj?.response?.data?.message || labelsErrorObj?.message || ''
  }, [labelsErrorObj])

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-heading-2 font-semibold">Create New Topic</h1>
          <p className="text-body-md text-muted-foreground mt-2">Build a flexible submission with custom content blocks</p>
        </div>

        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="flex items-center gap-4">
            <div className={stepCircleClass(1)}>1</div>
            <div className={`w-20 text-center text-sm ${step === 1 ? 'text-blue-600' : step > 1 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {stepTitles[1]}
            </div>
          </div>
          <div className={connectorClass(1)} />
          <div className="flex items-center gap-4">
            <div className={stepCircleClass(2)}>2</div>
            <div className={`w-24 text-center text-sm ${step === 2 ? 'text-blue-600' : step > 2 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {stepTitles[2]}
            </div>
          </div>
          <div className={connectorClass(2)} />
          <div className="flex items-center gap-4">
            <div className={stepCircleClass(3)}>3</div>
            <div className={`w-28 text-center text-sm ${step === 3 ? 'text-blue-600' : 'text-muted-foreground'}`}>{stepTitles[3]}</div>
          </div>
        </div>

        <Card>
          <CardContent>
            <CardTitle className="text-heading-3">{stepTitles[step]}</CardTitle>

            {step === 1 && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm block mb-1">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter topic title..." />
                  {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="text-sm block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-3 min-h-30 text-sm"
                    placeholder="Describe the purpose and context of this topic..."
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="text-sm block mb-1">Room</label>
                  {/* PERBAIKAN: value tidak boleh undefined */}
                  <Select 
                    value={selectedRoom} 
                    onValueChange={(value) => setSelectedRoom(value)} 
                    disabled={roomsLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={roomsLoading ? 'Memuat data ruangan...' : 'Select a room...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.room && <p className="text-xs text-red-600 mt-1">{errors.room}</p>}
                  {roomsError && (
                    <p className="text-xs text-rose-600 mt-1">
                      {roomsErrorMessage}
                      <button type="button" className="ml-2 underline" onClick={() => refetchRooms()}>
                        Coba lagi
                      </button>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm block mb-1">Security Level</label>
                  {/* PERBAIKAN: value harus selalu ada */}
                  <Select 
                    value={securityLevel} 
                    onValueChange={setSecurityLevel}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih level keamanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {securityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm block mb-1">Labels</label>
                  {!labelsSupported ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      Dukungan API label belum aktif di lingkungan ini. Hubungi admin untuk mengaktifkan fitur label.
                    </div>
                  ) : labelsLoading ? (
                    <p className="text-xs text-muted-foreground">Memuat data label...</p>
                  ) : labels.length === 0 ? (
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      Belum ada label terdaftar. Silakan tambah label melalui halaman Administrasi &gt; Label.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {labels.map((label) => {
                          const active = isLabelSelected(label.id)
                          return (
                            <button
                              type="button"
                              key={label.id}
                              onClick={() => toggleLabel(label.id)}
                              className={`px-3 py-1 rounded-full border text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                                active ? 'shadow-sm' : ''
                              }`}
                              style={{
                                borderColor: label.color || '#cbd5f5',
                                backgroundColor: active ? `${label.color || '#64748b'}24` : 'transparent',
                                color: label.color || '#0f172a',
                              }}
                            >
                              {label.name}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedLabels.length ? `${selectedLabels.length} label dipilih.` : 'Pilih label untuk membantu tim menemukan topik lebih cepat.'}
                      </p>
                    </>
                  )}
                  {labelsError && (
                    <p className="text-xs text-rose-600 mt-1">
                      {labelsErrorMessage}
                      <button type="button" className="ml-2 underline" onClick={() => refetchLabels()}>
                        Coba lagi
                      </button>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm block mb-1">Deadline (Optional)</label>
                  <Input 
                    type="datetime-local" 
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)} 
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" className="mr-3" onClick={handleBack}>
                    Cancel
                  </Button>
                  <Button onClick={handleNext}>Next: Add Content</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Add Content Blocks</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Build your submission by adding different types of content blocks. Drag to reorder.
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => addBlock('text')} className="px-3 py-1 border rounded-md">
                      Text
                    </button>
                    <button type="button" onClick={() => addBlock('richtext')} className="px-3 py-1 border rounded-md">
                      Rich Text
                    </button>
                    <button type="button" onClick={() => addBlock('file')} className="px-3 py-1 border rounded-md">
                      File Upload
                    </button>
                    <button type="button" onClick={() => addBlock('image')} className="px-3 py-1 border rounded-md">
                      Image
                    </button>
                    <button type="button" onClick={() => addBlock('link')} className="px-3 py-1 border rounded-md">
                      Link
                    </button>
                    <button type="button" onClick={() => addBlock('form')} className="px-3 py-1 border rounded-md">
                      Form Data
                    </button>
                  </div>
                </div>

                <div className="border rounded-md p-6 min-h-40 bg-white">
                  {blocks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <div className="mb-4">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-slate-300">
                          <path d="M8 7h8M8 12h8M8 17h8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium">No content blocks yet</h4>
                      <p className="text-sm text-muted-foreground mt-2">Add blocks above to build your submission</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blocks.map((block) => (
                        <div key={block.id}>
                          <div className="border rounded-md p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="text-slate-400">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <input
                                  className="text-sm font-medium border-b pb-1"
                                  value={block.title}
                                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                />
                                <span className="text-xs text-muted-foreground ml-2">{block.type}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  className="p-1 text-red-600"
                                  onClick={() => removeBlock(block.id)}
                                  title="Remove block"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {block.type === 'form' && (
                              <div className="space-y-2">
                                {block.fields.map((field) => (
                                  <div key={field.id} className="grid grid-cols-2 gap-3 items-start">
                                    <input
                                      placeholder="Field name"
                                      className="w-full border rounded p-2 text-sm"
                                      value={field.name}
                                      onChange={(e) =>
                                        updateBlock(block.id, {
                                          fields: block.fields.map((item) => (item.id === field.id ? { ...item, name: e.target.value } : item)),
                                        })
                                      }
                                    />
                                    <div className="flex gap-2">
                                      <input
                                        placeholder="Field value"
                                        className="w-full border rounded p-2 text-sm"
                                        value={field.value}
                                        onChange={(e) =>
                                          updateBlock(block.id, {
                                            fields: block.fields.map((item) => (item.id === field.id ? { ...item, value: e.target.value } : item)),
                                          })
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="text-red-600"
                                        onClick={() =>
                                          updateBlock(block.id, {
                                            fields: block.fields.filter((item) => item.id !== field.id),
                                          })
                                        }
                                      >
                                        ✖
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <div>
                                  <button
                                    type="button"
                                    className="px-3 py-1 border rounded-md text-sm inline-flex items-center gap-2"
                                    onClick={() =>
                                      updateBlock(block.id, {
                                        fields: [
                                          ...block.fields,
                                          { id: `${block.id}-f-${block.fields.length + 1}`, name: '', value: '' },
                                        ],
                                      })
                                    }
                                  >
                                    <PlusSquare className="w-4 h-4" /> Add field
                                  </button>
                                </div>
                              </div>
                            )}

                            {(block.type === 'image' || block.type === 'file') && (
                              <div>
                                <div className="border border-dashed rounded p-6 text-center">
                                  <div className="mb-2">
                                    <UploadCloud className="w-6 h-6 mx-auto text-muted-foreground" />
                                  </div>
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null
                                      updateBlock(block.id, { file, fileName: file ? file.name : '' })
                                    }}
                                  />
                                  {block.fileName && <div className="text-sm mt-2">{block.fileName}</div>}
                                </div>
                              </div>
                            )}
                          </div>

                          {(block.type === 'text' || block.type === 'richtext' || block.type === 'link') && (
                            <div className="border rounded-md p-3 mt-2">
                              {block.type === 'link' && (
                                <input
                                  placeholder="Enter link..."
                                  className="w-full border rounded p-2 text-sm"
                                  value={block.url}
                                  onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                />
                              )}

                              {block.type === 'richtext' && (
                                <div className="border rounded">
                                  <RichTextEditor
                                    value={block.content || ''}
                                    onChange={(html) => updateBlock(block.id, { content: html })}
                                  />
                                </div>
                              )}

                              {block.type === 'text' && (
                                <input
                                  placeholder="Enter text..."
                                  className="w-full border rounded p-2 text-sm"
                                  value={block.content}
                                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button onClick={handleNext}>Next: Review</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-4 space-y-4">
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Title</div>
                        <div className="mt-1 text-sm">{title || <span className="text-muted-foreground">(No title)</span>}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Description</div>
                        <div className="mt-1 text-sm">{description || <span className="text-muted-foreground">(No description)</span>}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Room</div>
                        <div className="mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{currentRoomName}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Security Level</div>
                        <div className="mt-1 text-sm capitalize">{securityLevel}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Labels</div>
                        {!labelsSupported ? (
                          <div className="mt-2 text-xs text-muted-foreground">Label belum tersedia di lingkungan ini.</div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedLabelObjects.length ? (
                              selectedLabelObjects.map((label) => (
                                <span
                                  key={label.id}
                                  className="text-xs px-2 py-0.5 rounded-full border"
                                  style={{
                                    borderColor: label.color || '#cbd5f5',
                                    backgroundColor: `${label.color || '#64748b'}24`,
                                    color: label.color || '#0f172a',
                                  }}
                                >
                                  {label.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Tidak ada label dipilih.</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Deadline</div>
                        <div className="mt-1 text-sm">{deadline || '-'} </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Content Blocks ({blocks.length})</div>
                        <div className="mt-2 space-y-2">
                          {blocks.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Belum ada konten.</div>
                          ) : (
                            blocks.map((block) => (
                              <div key={block.id} className="flex items-center gap-3 border rounded-md p-2 bg-slate-50">
                                <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 lowercase">
                                  {block.type}
                                </div>
                                <div className="text-sm">{block.title}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {mutationMessage && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{mutationMessage}</div>
                )}

                <div className="border rounded-md p-4 bg-white">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h4 className="text-sm font-medium">Ready to Publish?</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        Once published, this topic will move to "In Review" status and assigned reviewers will be notified.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" disabled={isBusy} onClick={() => handleSubmit('draft')}>
                        {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save as Draft
                      </Button>
                      <Button className="bg-blue-600 text-white" disabled={isBusy} onClick={() => handleSubmit('publish')}>
                        {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish for Review
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <div />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}