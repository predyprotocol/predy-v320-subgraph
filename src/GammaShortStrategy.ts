import { DepositedToStrategy, WithdrawnFromStrategy } from '../generated/GammaShortStrategy/GammaShortStrategy'
import { StrategyUserHistoryItem } from '../generated/schema'

export function handleDepositedToStrategy(event: DepositedToStrategy): void {
  const entity = new StrategyUserHistoryItem(event.transaction.hash.toHex())

  entity.address = event.address
  entity.action = 'DEPOSIT'
  entity.account = event.params.account
  entity.strategyAmount = event.params.strategyTokenAmount
  entity.marginAmount = event.params.depositedAmount
  entity.txHash = event.transaction.hash.toHex()

  entity.createdAt = event.block.timestamp
  entity.save()
}

export function handleWithdrawnFromStrategy(event: WithdrawnFromStrategy): void {
  const entity = new StrategyUserHistoryItem(event.transaction.hash.toHex())

  entity.address = event.address
  entity.action = 'WITHDRAW'
  entity.account = event.params.account
  entity.strategyAmount = event.params.strategyTokenAmount
  entity.marginAmount = event.params.withdrawnAmount
  entity.txHash = event.transaction.hash.toHex()

  entity.createdAt = event.block.timestamp
  entity.save()
}
