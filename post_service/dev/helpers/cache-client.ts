import { createClient } from 'redis'
import { log } from './logger'

export let CacheClient = createClient({ 
    socket: {
        host: process.env.REDIS_HOST
    },
    password: process.env.REDIS_PASS
 })

CacheClient.on('error', (err) => {
    log('error', 'redis-connection-error', { reason: err })
    process.exit(1)
})
