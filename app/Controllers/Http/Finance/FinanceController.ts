import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Beneficiary from 'App/Models/Beneficiary'
import User from 'App/Models/User'
import Wallet from 'App/Models/Wallet'
import WalletTransaction from 'App/Models/WalletTransaction'
import FlutterWaveService from 'App/Services/FlutterWave'
import CreateBeneficiaryValidator from 'App/Validators/CreateBeneficiaryValidator'
import FlutterwaveChargePayloadValidator from 'App/Validators/FlutterwaveChargePayloadValidator'

export default class FinanceController {
  public async createWallet({ response, auth }: HttpContextContract) {
    const authentication = auth.use('api')
    const isAuthenticated = authentication.isAuthenticated
    if (!isAuthenticated) {
      return response.status(401).send({ error: 'Unauthorized' })
    }
    const userId = ((await authentication.user) as User).id.toString()
    await Wallet.create({
      userId,
      balance: '0',
    })
    return response.status(201).send({ success: 'Wallet created' })
  }
  public async fundWallet({ request, response, auth }: HttpContextContract) {
    const authentication = auth.use('api')
    const isAuthenticated = authentication.isAuthenticated
    if (!isAuthenticated) {
      return response.status(401).send({ error: 'Unauthorized' })
    }

    const userId = ((await authentication.user) as User).id.toString()
    const email = authentication.user?.email

    // to fund wallet
    // check if wallet exist
    const userWallet = await Wallet.findBy('userId', userId)
    if (!userWallet) {
      return response.status(404).send({ error: 'Wallet not found' })
    }
    // validate request
    // TODO: implement data unmasking
    const data = await request.validate(FlutterwaveChargePayloadValidator)
    const currency = 'NGN'
    const txRef =
      'dummy_tx_ref-' +
      Math.floor(Math.random() * 1000000).toString() +
      '-' +
      Date.now().toString().toString()

    const pin = data.pin
    delete (data as Record<string, unknown>).pin

    // prepare payload
    const payload = {
      ...data,
      email,
      currency,
      tx_ref: txRef,
    }

    let walletTransaction: WalletTransaction
    let redirectUrl: string | undefined
    let flwRef: string | undefined
    let transactionReference: string | undefined

    // initiate charge
    await Database.transaction(async (trx) => {
      walletTransaction = new WalletTransaction()
      walletTransaction.walletId = userWallet.id.toString()
      walletTransaction.amount = data.amount.toString()
      walletTransaction.type = 'credit'
      walletTransaction.transactionReference = txRef
      walletTransaction.status = 'pending'
      walletTransaction.paymentGatewayId = 'dummy-paymentGatewayId'

      walletTransaction.useTransaction(trx)
      walletTransaction = await walletTransaction.save()

      const flutterResponse = await FlutterWaveService.charge(payload, pin)
      redirectUrl = flutterResponse?.redirectUrl
      flwRef = flutterResponse?.flw_ref
      if (flwRef) {
        // update wallet transaction
        walletTransaction.flwRef = flwRef as string
        await walletTransaction.save()
        transactionReference = walletTransaction.transactionReference
      }
    })

    return response.json({
      ...(redirectUrl ? { redirectUrl } : ''),
      ...(transactionReference ? { transactionReference: transactionReference } : ''),
    })
    // return
  }

  public async validateFundingRequest({ request, response, auth }: HttpContextContract) {
    const authentication = auth.use('api')
    const isAuthenticated = authentication.isAuthenticated
    if (!isAuthenticated) {
      return response.status(401).send({ error: 'Unauthorized' })
    }
    const userId = ((await authentication.user) as User).id.toString()
    const transactionReference = request.param('transactionReference', '') as string
    const otp = request.qs().otp as string
    const otpCount = 6
    const hasValidCount = typeof otp === 'string' && otp.length === otpCount
    if (hasValidCount) {
      // fetch flw_ref
      const walletTransaction = await WalletTransaction.findBy(
        'transactionReference',
        transactionReference
      )
      if (!walletTransaction || walletTransaction.status === 'successful') {
        // send bad request
        return response.status(400).send('Invalid reference')
      }

      // validate with flutterwave
      const flutterResponse = await FlutterWaveService.validate({
        otp,
        flw_ref: walletTransaction.flwRef,
      })

      if (flutterResponse?.status === 'successful') {
        await Database.transaction(async (trx) => {
          const userWallet = await Wallet.findBy('userId', userId, { client: trx })
          // update transaction reference to successful
          if (userWallet) {
            const prevBalance = Number(userWallet.balance)
            userWallet.balance = prevBalance + walletTransaction.amount

            userWallet.useTransaction(trx)
            await userWallet.save()
          }

          walletTransaction.status = 'successful'
          walletTransaction.useTransaction(trx)
          await walletTransaction.save()
        })

        return response.status(204)
      }

      // update transaction reference to successful
      walletTransaction.status = 'failed'
      await walletTransaction.save()
      return response.status(400).send('Invalid otp')
    }
    return response.status(400).send('Invalid otp')
  }

  public async createBeneficiary({ request, response, auth }: HttpContextContract) {
    const authentication = auth.use('api')
    const isAuthenticated = authentication.isAuthenticated
    if (!isAuthenticated) {
      return response.status(401).send({ error: 'Unauthorized' })
    }

    const userId = ((await authentication.user) as User).id.toString()

    const data = request.validate(CreateBeneficiaryValidator)
    await Beneficiary.create({ ...data, userId })
    return response.status(201)
  }

  public async getBeneficiaries({ response, auth }: HttpContextContract) {
    const authentication = auth.use('api')
    const isAuthenticated = authentication.isAuthenticated
    if (!isAuthenticated) {
      return response.status(401).send({ error: 'Unauthorized' })
    }

    const userId = ((await authentication.user) as User).id.toString()
    // query user beneficiaries
    const beneficiaries = await Beneficiary.query().where({ userId })
    return beneficiaries.length > 0
      ? response.json(beneficiaries)
      : response.send('You have no beneficiaries')
  }

  public async sendMoney({ request, response, auth }: HttpContextContract) {
    const authentication = auth.use('api')
    const isAuthenticated = authentication.isAuthenticated
    if (!isAuthenticated) {
      return response.status(401).send({ error: 'Unauthorized' })
    }

    const amount = Number(request.input('amount', '0'))
    const beneficiaryId = request.input('beneficiaryId')

    if (!amount || amount <= 0 || !beneficiaryId) {
      return response.status(400).send('Invalid request')
    }

    const userId = ((await authentication.user) as User).id.toString()
    // get wallet and check balance
    const userWallet = await Wallet.findBy('userId', userId)
    if (!userWallet) {
      return response.status(400).send('User wallet not found')
    }
    const walletBalance = +userWallet.balance
    const canSendMoney = walletBalance >= amount
    if (!canSendMoney) {
      return response.status(400).send('Insufficient fund')
    }
    const transferIsSuccessful = true
    const transactionReference = 'dummy_trx_ref'
    // send money with flutter wave
    // TODO: implement flutter wave transfer

    if (transferIsSuccessful) {
      await Database.transaction(async (trx) => {
        // update user wallet balance
        userWallet.balance = String(walletBalance - amount)
        userWallet.useTransaction(trx)
        await userWallet.save()

        const walletTransaction = new WalletTransaction()

        walletTransaction.type = 'debit'
        walletTransaction.amount = String(amount)
        walletTransaction.status = 'successful'
        walletTransaction.reason = ''
        walletTransaction.paymentGatewayId = 'dummy-paymentGatewayId'
        walletTransaction.transactionReference = transactionReference
        walletTransaction.walletId = String(userWallet.id)

        walletTransaction.useTransaction(trx)
        await walletTransaction.save()
      })
    }
    return 'send money'
  }
}
