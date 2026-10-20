import type { Metadata } from 'next'
import { ReceiverView } from '@/components/glassdrop/receiver-view'

export const metadata: Metadata = {
  title: 'Incoming drop — GlassDrop',
  robots: { index: false, follow: false },
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReceiverView id={id} />
}
