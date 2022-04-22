import { createSocket } from 'dgram'
import { hostname } from 'os'
import { Request } from 'express'

const client = createSocket('udp4')

process.on('beforeExit', () => {
    client.close()
})

const host = hostname()
const NODE_ENV = process.env.NODE_ENV

export const log = async (severity: 'error' | 'warn' | 'info' | 'debug', type: string, fields: any, req?: Request) => {
    let reqFields = { }

    if (req) {
        reqFields = {
            path: req.url,
            method: req.method,
            ip: req.ip,
            ua: req.headers['user-agent'] || null
        }
    }

    const payload = JSON.stringify({
        '@timestamp': (new Date()).toISOString(),
        '@version': 1,
        app: 'auth-service',
        environment: NODE_ENV,
        severity,
        type,
        reqFields,
        fields,
        host
    })
    client.send(payload, Number.parseInt(process.env.LS_PORT || "7777"), process.env.LS_HOST, (err, bytes) => {
        if (err) console.error(err)
    })
}