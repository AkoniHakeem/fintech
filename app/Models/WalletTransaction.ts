import { DateTime } from 'luxon'
import { column, BaseModel, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public type: 'credit' | 'debit'

  @column()
  public status: 'successful' | 'failed' | 'pending'

  @column()
  public flwRef: string

  @column()
  public amount: string

  @column()
  public reason: string

  @column({ columnName: 'transaction_reference' })
  public transactionReference: string

  @column({ columnName: 'payment_gateway_id' })
  public paymentGatewayId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column({ columnName: 'wallet_id' })
  public walletId: string

  @belongsTo(() => Wallet, { foreignKey: 'walletId' })
  public wallet: BelongsTo<typeof Wallet>
}
