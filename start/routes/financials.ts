import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('/wallet', 'FinanceController.createWallet')
  Route.post('/wallet/fund', 'FinanceController.fundWallet')
  Route.put('/wallet/fund/:transactionReference', 'FinanceController.validateFundingRequest')
  Route.post('/beneficiary', 'FinanceController.createBeneficiary')
  Route.get('/beneficiary', 'FinanceController.getBeneficiaries')
  Route.put('/wallet', 'FinanceController.sendMoney')
})
  .middleware('auth')
  .prefix('/api/v1/financials')
