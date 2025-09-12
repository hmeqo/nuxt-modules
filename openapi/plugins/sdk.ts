import { setSdk } from '@hmeqo/openapi-utils'
import * as sdk from '@workspace/backend/lib/sdk'

export default defineNuxtPlugin(() => {
  setSdk(sdk)
})
