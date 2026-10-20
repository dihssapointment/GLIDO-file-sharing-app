export const MAX_FILES = 10
export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const MAX_TEXT_LENGTH = 20_000

export type PublicFile = {
  index: number
  name: string
  size: number
  contentType: string
}

export type PublicSession = {
  id: string
  code: string
  text: string | null
  files: PublicFile[]
  remainingMs: number
}

export type CreatedSession = {
  id: string
  code: string
  ownerToken: string
  remainingMs: number
}

export type SessionStatus = {
  received: boolean
  remainingMs: number
}
