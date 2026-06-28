'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, QrCode, Loader2, CheckCircle2 } from 'lucide-react'
import { sessionsApi } from '@/lib/api/services'
import { sessionSocket } from '@/lib/socket/client'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  botName: string
  botId?: string
}

interface QrEvent {
  botId: string
  qr: string
}

interface StatusEvent {
  botId: string
  status: string
}

export function QRCodeModal({ isOpen, onClose, botName, botId }: QRCodeModalProps) {
  const [qr, setQr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !botId) return
    let active = true
    setQr(null)
    setConnected(false)
    setError(null)

    sessionsApi
      .create(botId)
      .then((res) => {
        if (active && res.qr) setQr(res.qr)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to start session')
      })

    sessionSocket.connect()
    const offQr = sessionSocket.on('qr', (payload) => {
      const p = payload as QrEvent
      if (p.botId === botId && p.qr) setQr(p.qr)
    })
    const offConnected = sessionSocket.on('connected', (payload) => {
      const p = payload as StatusEvent
      if (p.botId === botId) setConnected(true)
    })

    return () => {
      active = false
      offQr()
      offConnected()
    }
  }, [isOpen, botId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1F2937]">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            Link Device: {botName}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-6 w-56 h-56 flex items-center justify-center">
            {connected ? (
              <CheckCircle2 className="w-20 h-20 text-[#4ae176]" />
            ) : qr ? (
              <Image src={qr} alt="WhatsApp QR code" width={192} height={192} unoptimized />
            ) : error ? (
              <span className="text-sm text-red-500 text-center px-2">{error}</span>
            ) : (
              <Loader2 className="w-10 h-10 text-[#111827] animate-spin" />
            )}
          </div>

          {connected ? (
            <h4 className="text-center font-medium text-[#4ae176] mb-2">Device linked successfully!</h4>
          ) : (
            <>
              <h4 className="text-center font-medium text-foreground mb-2">Scan QR Code</h4>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 max-w-[250px]">
                <li>Open WhatsApp on your phone</li>
                <li>Tap Menu or Settings and select Linked Devices</li>
                <li>Tap on Link a Device</li>
                <li>Point your phone to this screen</li>
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
