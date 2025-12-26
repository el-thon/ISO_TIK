import React, { useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useParams, Link } from 'react-router-dom'
import { sampleTopics } from './mocks/data'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home, ArrowLeft, Edit, Download, FileText, Link as LinkIcon, ChevronDown } from 'lucide-react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { useRef, useEffect } from 'react'

export default function TopicDetail() {
  const { id } = useParams()
  const topic = sampleTopics.find((t) => t.id === id) || sampleTopics[0]
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [showHtml, setShowHtml] = useState(false)
  const quillRef = useRef(null)
  const editorContainerRef = useRef(null)

  useEffect(() => {
    if (advancedOpen && editorContainerRef.current && !quillRef.current) {
      const toolbarOptions = [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['code', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote'],
        ['link', 'image'],
        ['clean'],
      ]

      quillRef.current = new Quill(editorContainerRef.current, {
        theme: 'snow',
        placeholder: 'Tambahkan komentar...',
        modules: { toolbar: toolbarOptions },
      })
      quillRef.current.on('text-change', () => {
        setComment(quillRef.current.root.innerHTML)
      })
    }
    // cleanup when closing advanced
    return () => {
      if (!advancedOpen && quillRef.current) {
        quillRef.current = null
      }
    }
  }, [advancedOpen])

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard" className="inline-flex items-center gap-2">
                    <Home className="w-4 h-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/topics">Topik</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>{topic.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {/* Header card */}
            <Card className="mb-4">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <Link to="/topics" className="text-muted-foreground hover:underline inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                      </Link>
                      <h2 className="text-heading-2 font-semibold">{topic.title}</h2>
                    </div>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {topic.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{tag}</span>
                      ))}
                      <div className="ml-2 inline-flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback>{topic.responsible.initials}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm text-muted-foreground">Created by {topic.author} · {topic.category}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="#"><Edit className="w-4 h-4 mr-2" />Edit</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>

            {/* Content blocks */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Konten</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Lampiran dan informasi terkait</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">Justifikasi</div>
                        <div className="text-sm text-muted-foreground mt-1">Firewall saat ini sudah berusia 5 tahun dan tidak mendukung protokol keamanan terbaru.</div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <div>
                          <div className="text-sm font-medium">Proposal Teknis</div>
                          <div className="text-xs text-muted-foreground">proposal-firewall-upgrade.pdf · 2.34 MB</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Edited 13/12/2024</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href="#" onClick={(e) => e.preventDefault()}><Download className="w-4 h-4 mr-2" />Download</a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-white">
                    <div className="flex items-start gap-3">
                      <LinkIcon className="w-5 h-5 text-slate-500" />
                      <a className="text-sm text-blue-600" href="https://vendor.example.com/firewall-specs" target="_blank" rel="noreferrer">https://vendor.example.com/firewall-specs</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments & Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Komentar & Review</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Diskusi terkait topik ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen((s) => !s)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                      <span>{advancedOpen ? 'Advanced Mode' : 'Quick Mode'}</span>
                    </button>

                    <div className="text-xs text-muted-foreground">0/5000 · L2</div>
                  </div>

                  {advancedOpen ? (
                    <div className="border rounded-md p-2">
                      <div ref={editorContainerRef} />
                    </div>
                  ) : (
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-slate-200 rounded-md p-3 min-h-16 text-sm" placeholder="Tambahkan komentar singkat..." />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => { setComment(''); if (quillRef.current) quillRef.current.setText('') }}>Clear</Button>
                  <Button className="bg-blue-600 text-white" onClick={() => {
                    // Post comment: for now just log and optionally save later
                    // We'll use comment (HTML when advanced) or plain text
                    // eslint-disable-next-line no-console
                    console.log('Post comment payload:', { html: comment })
                  }}>Post Comment</Button>
                  <Button variant="outline" onClick={() => setShowHtml((s) => !s)}>{showHtml ? 'Sembunyikan HTML' : 'Lihat HTML'}</Button>
                </div>

                {showHtml && (
                  <div className="mt-3">
                    <label className="text-xs text-muted-foreground mb-1 block">HTML Source</label>
                    <textarea readOnly className="w-full border border-slate-200 rounded-md p-3 min-h-24 text-xs" value={comment} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Responsible</div>
                  <div className="flex items-center gap-3 mt-2">
                    <Avatar>
                      <AvatarFallback>{topic.responsible.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm">{topic.author}</div>
                      <div className="text-xs text-muted-foreground">Created 10/12/2024, 07:00</div>
                      <div className="text-xs text-muted-foreground">Last Updated 14/12/2024, 07:00</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">Ahmad Fauzi</div>
                        <div className="text-xs text-muted-foreground">Return to sender · Due 10/12/2024</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">pending</div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">Siti Rahayu</div>
                        <div className="text-xs text-muted-foreground">Forward to reviewer · Due 20/12/2024</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">—</div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
