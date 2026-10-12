import type { Job, Location, Skill } from '@/payload-types'

// Linked skills of a job (populated ones only: depth >= 1)
export const jobSkills = (job: Pick<Job, 'skills'>): Skill[] =>
  (job.skills ?? []).filter((s): s is Skill => typeof s === 'object' && s !== null)

export const jobCity = (job: Pick<Job, 'city'>): Location | null =>
  typeof job.city === 'object' && job.city ? job.city : null

// What to show as the job's place: the city from the list, else the old free text
export const jobPlace = (job: Pick<Job, 'city' | 'location'>): string | null => jobCity(job)?.name ?? job.location ?? null
