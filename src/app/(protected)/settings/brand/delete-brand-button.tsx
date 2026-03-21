'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteBrandAction } from './actions'

const Spinner = () => (
  <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export function DeleteBrandButton({ brandId }: { brandId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        const fd = new FormData()
        fd.set('id', brandId)
        startTransition(() => deleteBrandAction(fd))
      }}
      className="h-8 px-3 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 gap-1.5"
    >
      {isPending && <Spinner />}
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
