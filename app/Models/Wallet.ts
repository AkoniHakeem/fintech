import { DateTime } from 'luxon'
import { column, BaseModel, BelongsTo, belongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import WalletTransaction from './WalletTransaction'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public balance: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user: BelongsTo<typeof User>

  @hasMany(() => WalletTransaction, { foreignKey: 'walletId' })
  public walletTransactions: HasMany<typeof WalletTransaction>
}
