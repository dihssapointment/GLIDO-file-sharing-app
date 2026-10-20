'use client'

import { AnimatePresence } from 'framer-motion'
import { Download, Upload } from 'lucide-react'
import { useState } from 'react'
import type { CreatedSession } from '@/lib/types'
import { ExpiredState } from './expired-state'
import { GlassPanel } from './glass'
import { ReceiveCodeForm } from './receive-code-form'
import { Segmented } from './segmented'
import { SenderCompose } from './sender-compose'
import { SenderSession } from './sender-session'

type Mode = 'send' | 'receive'
type SenderState =
  | { phase: 'compose' }
  | { phase: 'active'; session: CreatedSession; deadline: number }
  | { phase: 'expired' }

export function Home() {
  const [mode, setMode] = useState<Mode>('send')
  const [sender, setSender] = useState<SenderState>({ phase: 'compose' })
  const locked = sender.phase === 'active'

  return (
    <div className="flex flex-col gap-4">
      {!locked && (
        <Segmented
          label="Mode"
          value={mode}
          onChange={setMode}
          className="glass"
          options={[
            { value: 'send', label: 'Send', icon: Upload },
            { value: 'receive', label: 'Receive', icon: Download },
          ]}
        />
      )}

      <AnimatePresence mode="wait">
        {mode === 'receive' && !locked ? (
          <GlassPanel key="receive">
            <ReceiveCodeForm />
          </GlassPanel>
        ) : sender.phase === 'compose' ? (
          <GlassPanel key="compose">
            <SenderCompose
              onCreated={(session) =>
                setSender({
                  phase: 'active',
                  session,
                  deadline: Date.now() + session.remainingMs,
                })
              }
            />
          </GlassPanel>
        ) : sender.phase === 'active' ? (
          <GlassPanel key={`active-${sender.session.id}`}>
            <SenderSession
              session={sender.session}
              deadline={sender.deadline}
              onExpired={() => setSender({ phase: 'expired' })}
            />
          </GlassPanel>
        ) : (
          <GlassPanel key="expired">
            <ExpiredState onRestart={() => setSender({ phase: 'compose' })} />
          </GlassPanel>
        )}
      </AnimatePresence>
    </div>
  )
}
