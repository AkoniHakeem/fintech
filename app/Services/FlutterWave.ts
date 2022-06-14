import axios from 'axios'
import Encrypt from './Encrypt'
import Env from '@ioc:Adonis/Core/Env'

export default class FlutterWaveService {
  public static async charge(
    payload: unknown,
    pin: string
  ): Promise<{ flw_ref?: string; redirectUrl?: string } | undefined> {
    try {
      const chargeEndpoint = 'https://api.flutterwave.com/v3/charges'
      const response = (await sendRequest(chargeEndpoint, payload, true)) as {
        meta: {
          authorization: {
            mode: 'pin' | 'redirect' | 'otp' | 'banktransfer'
            redirect: string
          }
        }
      }
      //   const response = await FlutterWaveService.flw.Charge.card(payload)
      //   console.log(response)

      if (response.meta.authorization.mode === 'pin') {
        let updatedPayload = payload as Record<string, unknown>
        updatedPayload.authorization = {
          mode: 'pin',
          fields: ['pin'],
          pin,
        }
        const reCallCharge = (await sendRequest(chargeEndpoint, updatedPayload, true)) as {
          data: { flw_ref: string }
        }

        return { flw_ref: reCallCharge.data.flw_ref }
      }
      if (response.meta.authorization.mode === 'redirect') {
        var redirectUrl = response.meta.authorization.redirect
        return { redirectUrl }
      }
      return undefined
    } catch (error) {
      console.log(error)
    }
  }

  public static async validate(payload: unknown): Promise<{ status: string } | undefined> {
    try {
      const validateEndpoint = 'https://api.flutterwave.com/v3/validate-charge'
      const response = (await sendRequest(validateEndpoint, payload)) as { status: string }
      //   console.log(response)
      //   const callValidate = await sendRequest(validateEndpoint, secretKey, {
      //     otp: '12345',
      //     flw_ref: reCallCharge.data.flw_ref,
      //   })
      //   console.log(callValidate)
      return response
    } catch (error) {
      console.log(error)
    }
  }
}

const sendRequest = async (chargeEndpoint: string, payload: unknown, encrypt = false) => {
  const encryptionKey = Env.get('FLW_ENCRYPTION_KEY')
  const secretKey = Env.get('FLW_SECRET')
  const response = await axios(chargeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
    },
    data: encrypt ? { client: Encrypt.encrypt(payload, encryptionKey) } : payload,
  })
  return response.data
}
