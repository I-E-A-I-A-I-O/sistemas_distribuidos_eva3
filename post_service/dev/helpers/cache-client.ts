import { createClient } from 'redis'
import { log } from './logger'

export let CacheClient = createClient()

CacheClient.on('error', (err) => {
    log('error', 'redis-connection-error', { reason: err })
    process.exit(1)
})
