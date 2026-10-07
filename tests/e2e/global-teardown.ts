import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { deleteTestData } from '../helpers/fixtures'

// Removes everything the e2e tests created (all @e2e.test users and their data)
export default async function globalTeardown() {
  const payload = await getPayload({ config })
  await deleteTestData(payload, '@e2e.test')
}
