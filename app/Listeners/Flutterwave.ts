import type { EventsList } from '@ioc:Adonis/Core/Event'

export default class FlutterwaveEvent {
  public static async onChargeComplete(eventData: EventsList['charge.complete']) {
    const trxRef = eventData['trx_ref']
    // TODO: find and update wallet and wallet transaction reference
  }
}
