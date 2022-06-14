import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from '@ioc:Adonis/Core/Event'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    const data = await request.validate(CreateUserValidator)
    const user = await User.create(data)

    // we can send email to the user here
    Event.emit('new:user', user)
    return response.status(201).send({ success: 'Registration successful' })
  }

  public async login({ request, response, auth }: HttpContextContract) {
    const password = request.input('password')
    const email = request.input('email')

    try {
      const token = await auth.use('api').attempt(email, password, {
        expiresIn: '24hours',
      })
      return token.toJSON()
    } catch (error) {
      return response.status(401).send({ error: 'Invalid credentials' })
    }
  }

  public async logout({ auth, response }: HttpContextContract) {
    await auth.use('api').logout()
    return response.status(200).send({ success: 'Logout successful' })
  }
}
