import React, { useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GripVertical, Trash2, PlusSquare, UploadCloud, FileText, Image, Link as LinkIcon } from 'lucide-react'
import { sampleRooms } from '@/pages/rooms/mocks/data'

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function CreateTopic() {
  const navigate = useNavigate()
  const location = useLocation()
  // If navigated from a room detail, the room id/title are passed via location.state
  const roomFromState = location?.state?.roomId || null
  const roomTitleFromState = location?.state?.roomTitle || null
  // Stepper / form state
  const [step, setStep] = useState(1)

  const stepTitles = {
    1: 'Basic Information',
    2: 'Content Blocks',
    3: 'Review & Publish',
  }

  function stepCircleClass(i) {
    if (i < step) return 'w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center'
    if (i === step) return 'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center'
    return 'w-8 h-8 rounded-full bg-slate-100 text-muted-foreground flex items-center justify-center'
  }

  function connectorClass(i) {
    return i < step ? 'w-24 h-1 bg-emerald-500 rounded-full' : 'w-24 h-1 bg-slate-200 rounded-full'
  }

  // Phase 1 inputs (mandatory)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(roomFromState || '')
  const [errors, setErrors] = useState({})

  // Phase 2: content blocks
  const [blocks, setBlocks] = useState([])

  function updateBlock(id, patch) {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  function validatePhase1() {
    const e = {}
    const chosenRoom = selectedRoom || roomFromState || ''
    if (!title.trim()) e.title = 'Title is required.'
    if (!description.trim()) e.description = 'Description is required.'
    if (!chosenRoom) e.room = 'Please select a room.'
    setErrors(e)
    return { ok: Object.keys(e).length === 0, chosenRoom }
  }

  function handleNext() {
    if (step === 1) {
      const { ok, chosenRoom } = validatePhase1()
      if (!ok) return
      // persist chosen room into controlled state so subsequent logic can read it
      if (chosenRoom && !selectedRoom) setSelectedRoom(chosenRoom)
      setStep(2)
      return
    }
    if (step === 2) {
      // proceed to review / publish (step 3)
      setStep(3)
      return
    }
    // On step 3, finalize (for now navigate back to topics list)
    navigate('/topics')
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
    else navigate(-1)
  }

  function addBlock(type) {
    const id = Date.now()
    let block = { id, type, title: `New ${type} block`, visible: true }
    switch (type) {
      case 'text':
        block.content = ''
        break
      case 'richtext':
        block.content = ''
        break
      case 'link':
        block.url = ''
        break
      case 'image':
        block.file = null
        block.fileName = ''
        break
      case 'file':
        block.file = null
        block.fileName = ''
        break
      case 'form':
        block.fields = [{ id: `${id}-f-1`, name: '', value: '' }]
        break
      default:
        block.content = ''
    }
    setBlocks((b) => [...b, block])
  }

  function removeBlock(id) {
    setBlocks((b) => b.filter((x) => x.id !== id))
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-heading-2 font-semibold">Create New Topic</h1>
          <p className="text-body-md text-muted-foreground mt-2">Build a flexible submission with custom content blocks</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="flex items-center gap-4">
            <div className={stepCircleClass(1)}>1</div>
            <div className={`w-20 text-center text-sm ${step === 1 ? 'text-blue-600' : step > 1 ? 'text-emerald-600' : 'text-muted-foreground'}`}>Basic Info</div>
          </div>
          <div className={connectorClass(1)} />
          <div className="flex items-center gap-4">
            <div className={stepCircleClass(2)}>2</div>
            <div className={`w-20 text-center text-sm ${step === 2 ? 'text-blue-600' : step > 2 ? 'text-emerald-600' : 'text-muted-foreground'}`}>Content Blocks</div>
          </div>
          <div className={connectorClass(2)} />
          <div className="flex items-center gap-4">
            <div className={stepCircleClass(3)}>3</div>
            <div className={`w-20 text-center text-sm ${step === 3 ? 'text-blue-600' : 'text-muted-foreground'}`}>Review & Publish</div>
          </div>
        </div>

        <Card>
          <CardContent>
            <CardTitle className="text-heading-3">Basic Information</CardTitle>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm block mb-1">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter topic title..." />
                  {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="text-sm block mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-200 rounded-md p-3 min-h-30 text-sm" placeholder="Describe the purpose and context of this topic..." />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="text-sm block mb-1">Room</label>
                  {roomFromState ? (
                    <div className="inline-flex items-center justify-between w-full border border-slate-200 rounded-md p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <strong>{roomTitleFromState}</strong>
                        <span className="text-muted-foreground text-sm">(selected)</span>
                      </div>
                      <input type="hidden" name="roomId" value={roomFromState} />
                    </div>
                  ) : (
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full border border-slate-200 rounded-md p-2 text-sm"
                    >
                      <option value="">Select a room...</option>
                      {sampleRooms.map((r) => (
                        <option key={r.title} value={slugify(r.title)}>{r.title}</option>
                      ))}
                    </select>
                  )}
                  {errors.room && <p className="text-xs text-red-600 mt-1">{errors.room}</p>}
                </div>

                <div>
                  <label className="text-sm block mb-1">Labels</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100">Urgent</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100">Bug</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100">Enhancement</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm block mb-1">Deadline (Optional)</label>
                  <Input placeholder="mm/dd/yyyy, --:-- --" />
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" className="mr-3" onClick={handleBack}>Cancel</Button>
                  <Button onClick={handleNext}>Next: Add Content</Button>
                </div>
              </div>
            )}

            {/* Step 2: Content Blocks */}
            {step === 2 && (
              <div className="mt-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Add Content Blocks</h3>
                  <p className="text-sm text-muted-foreground mb-3">Build your submission by adding different types of content blocks. Drag to reorder.</p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => addBlock('text')} className="px-3 py-1 border rounded-md">Text</button>
                    <button type="button" onClick={() => addBlock('richtext')} className="px-3 py-1 border rounded-md">Rich Text</button>
                    <button type="button" onClick={() => addBlock('file')} className="px-3 py-1 border rounded-md">File Upload</button>
                    <button type="button" onClick={() => addBlock('image')} className="px-3 py-1 border rounded-md">Image</button>
                    <button type="button" onClick={() => addBlock('link')} className="px-3 py-1 border rounded-md">Link</button>
                    <button type="button" onClick={() => addBlock('form')} className="px-3 py-1 border rounded-md">Form Data</button>
                  </div>
                </div>

                <div className="border rounded-md p-6 min-h-40 bg-white">
                  {blocks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <div className="mb-4">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-slate-300"><path d="M8 7h8M8 12h8M8 17h8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <h4 className="text-sm font-medium">No content blocks yet</h4>
                      <p className="text-sm text-muted-foreground mt-2">Add blocks above to build your submission</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blocks.map((b) => (
                        <div key={b.id}>
                          <div className="border rounded-md p-3">
                            {/* header: drag handle, title editable, delete */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="text-slate-400"><GripVertical className="w-4 h-4 text-muted-foreground" /></div>
                                <input
                                  className="text-sm font-medium border-b pb-1"
                                  value={b.title}
                                  onChange={(e) => updateBlock(b.id, { title: e.target.value })}
                                />
                                <span className="text-xs text-muted-foreground ml-2">{b.type}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <button type="button" className="p-1 text-red-600" onClick={() => removeBlock(b.id)} title="Remove block"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>

                            {/* for non-text/link/rich types we keep inner content here */}
                            {!(b.type === 'text' || b.type === 'richtext' || b.type === 'link') && (
                              <div>
                                {b.type === 'form' && (
                                  <div className="space-y-2">
                                    {b.fields.map((f) => (
                                      <div key={f.id} className="grid grid-cols-2 gap-3 items-start">
                                        <input
                                          placeholder="Field name"
                                          className="w-full border rounded p-2 text-sm"
                                          value={f.name}
                                          onChange={(e) => updateBlock(b.id, { fields: b.fields.map(x => x.id === f.id ? { ...x, name: e.target.value } : x) })}
                                        />
                                        <div className="flex gap-2">
                                          <input
                                            placeholder="Field value"
                                            className="w-full border rounded p-2 text-sm"
                                            value={f.value}
                                            onChange={(e) => updateBlock(b.id, { fields: b.fields.map(x => x.id === f.id ? { ...x, value: e.target.value } : x) })}
                                          />
                                          <button type="button" className="text-red-600" onClick={() => updateBlock(b.id, { fields: b.fields.filter(x => x.id !== f.id) })}>✖</button>
                                        </div>
                                      </div>
                                    ))}
                                    <div>
                                      <button type="button" className="px-3 py-1 border rounded-md text-sm inline-flex items-center gap-2" onClick={() => updateBlock(b.id, { fields: [...b.fields, { id: `${b.id}-f-${b.fields.length + 1}`, name: '', value: '' }] })}><PlusSquare className="w-4 h-4" /> Add field</button>
                                    </div>
                                  </div>
                                )}

                                {(b.type === 'image' || b.type === 'file') && (
                                  <div>
                                    <div className="border border-dashed rounded p-6 text-center">
                                      <div className="mb-2"><UploadCloud className="w-6 h-6 mx-auto text-muted-foreground" /></div>
                                      <input
                                        type="file"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null
                                          updateBlock(b.id, { file, fileName: file ? file.name : '' })
                                        }}
                                      />
                                      {b.fileName && <div className="text-sm mt-2">{b.fileName}</div>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* For text/link/richtext render content outside the wrapper so it can span full width */}
                          {(b.type === 'text' || b.type === 'richtext' || b.type === 'link') && (
                            <div className="border rounded-md p-3 mt-2">
                              {b.type === 'link' && (
                                <input
                                  placeholder="Enter link..."
                                  className="w-full border rounded p-2 text-sm"
                                  value={b.url}
                                  onChange={(e) => updateBlock(b.id, { url: e.target.value })}
                                />
                              )}

                              {b.type === 'richtext' && (
                                <textarea
                                  placeholder="Enter rich text content..."
                                  className="w-full border rounded p-2 text-sm min-h-24"
                                  value={b.content}
                                  onChange={(e) => updateBlock(b.id, { content: e.target.value })}
                                />
                              )}

                              {b.type === 'text' && (
                                <input
                                  placeholder="Enter text..."
                                  className="w-full border rounded p-2 text-sm"
                                  value={b.content}
                                  onChange={(e) => updateBlock(b.id, { content: e.target.value })}
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
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext}>Next: Review</Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Publish */}
            {step === 3 && (
              <div className="mt-4">
                <h3 className="text-heading-3">Review Your Submission</h3>

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
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{roomTitleFromState || sampleRooms.find(r => slugify(r.title) === selectedRoom)?.title || '-'}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Content Blocks ({blocks.length})</div>
                          <div className="mt-2 space-y-2">
                            {blocks.map((b) => (
                              <div key={b.id} className="flex items-center gap-3 border rounded-md p-2 bg-slate-50">
                                <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 lowercase">{b.type}</div>
                                <div className="text-sm">{b.title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="border rounded-md p-4 bg-white">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h4 className="text-sm font-medium">Ready to Publish?</h4>
                        <p className="text-sm text-muted-foreground mt-2">Once published, this topic will move to "In Review" status and assigned reviewers will be notified.</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button variant="outline">Save as Draft</Button>
                        <Button className="bg-blue-600 text-white">Publish for Review</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between">
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                    <div />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
