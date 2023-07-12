import { BigInt } from '@graphprotocol/graph-ts'
import {
  DepositedToStrategy,
  WithdrawnFromStrategy
} from '../generated/GammaShortStrategy/GammaShortStrategy'
import { StrategyUserHistoryItem } from '../generated/schema'
import { ensureStrategyUserPosition } from './helper'

export function handleDepositedToStrategy(event: DepositedToStrategy): void {
  const strategyAmount = event.params.strategyTokenAmount
  const depositedAmount = event.params.depositedAmount

  const position = ensureStrategyUserPosition(
    event.params.strategyId,
    event.params.account,
    event.block.timestamp
  )

  position.entryValue = position.entryValue.plus(depositedAmount)
  position.strategyAmount = position.strategyAmount.plus(strategyAmount)

  position.save()

  const entity = new StrategyUserHistoryItem(event.transaction.hash.toHex())

  entity.strategyId = event.params.strategyId
  entity.action = 'DEPOSIT'
  entity.account = event.params.account
  entity.strategyAmount = strategyAmount
  entity.marginAmount = depositedAmount
  entity.payoff = BigInt.zero()
  entity.txHash = event.transaction.hash.toHex()

  entity.createdAt = event.block.timestamp
  entity.save()
}

export function handleWithdrawnFromStrategy(
  event: WithdrawnFromStrategy
): void {
  const strategyAmount = event.params.strategyTokenAmount
  const withdrawnAmount = event.params.withdrawnAmount

  const position = ensureStrategyUserPosition(
    event.params.strategyId,
    event.params.account,
    event.block.timestamp
  )

  const closeEntryValue = position.entryValue
    .times(strategyAmount)
    .div(position.strategyAmount)
  const payoff = withdrawnAmount.minus(closeEntryValue)

  position.strategyAmount = position.strategyAmount.minus(strategyAmount)
  position.entryValue = position.entryValue.minus(closeEntryValue)

  position.save()

  const entity = new StrategyUserHistoryItem(event.transaction.hash.toHex())

  entity.strategyId = event.params.strategyId
  entity.action = 'WITHDRAW'
  entity.account = event.params.account
  entity.strategyAmount = strategyAmount
  entity.marginAmount = withdrawnAmount
  entity.payoff = payoff
  entity.txHash = event.transaction.hash.toHex()

  entity.createdAt = event.block.timestamp
  entity.save()
}
