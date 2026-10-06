import config from '@payload-config'
import { getPayload } from 'payload'

// Payload caches the instance internally, so calling this in every Server Component is cheap.
export const getPayloadClient = () => getPayload({ config })
