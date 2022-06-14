import type { EventsList } from '@ioc:Adonis/Core/Event'

export default class UserEvent {
  public static async onNewUser(user: EventsList['new:user']) {
    // TODO: send email to the user
  }
}
