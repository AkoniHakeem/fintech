import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('wallet_id').unsigned().notNullable().references('id').inTable('wallets')
      table.string('type').notNullable().defaultTo('credit').checkBetween(['credit', 'debit'])
      table
        .string('status')
        .notNullable()
        .defaultTo('successful')
        .checkBetween(['successful', 'failed', 'pending'])
      table.decimal('amount', 10, 2).notNullable().defaultTo(0)
      table.string('reason').notNullable().defaultTo('')
      table.string('transaction_reference').notNullable()
      table.string('payment_gateway_id').notNullable()
      table.string('flwRef').nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
