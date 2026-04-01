import { Suspense } from 'react'
import { SettingsContent } from '@/components/features/settings/settings-content'

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
