/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
import Event from '@ioc:Adonis/Core/Event'

Event.on('new:user', 'UserEvent.onNewUser')
Event.on('charge.complete', 'FlutterwaveEvent.onChargeComplete')
