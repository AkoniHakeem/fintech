import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Event from '@ioc:Adonis/Core/Event'

export default class WebHookController {
  public async handle({ request, response }: HttpContextContract) {
    const webHookHash = request.header('verif-hash')
    const webHookSecret = Env.get('FLUTTERWAVE_WEBHOOK_ENDPOINT_SECRET')
    if (webHookHash === webHookSecret) {
      // raise events
      const body = request.all()
      if (body) {
        const flutterwaveEvent = body['event']
        const eventData = body['data']

        Event.emit(flutterwaveEvent, eventData)
      }
    }

    // send response fast
    return response.status(204)
  }
}
