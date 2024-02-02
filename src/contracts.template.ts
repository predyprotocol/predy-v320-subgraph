import { Address } from '@graphprotocol/graph-ts'
import { PredyPool } from '../generated/PredyPool/PredyPool'
import { PerpMarket } from '../generated/PerpMarket/PerpMarket'

export const predyPoolAddress: Address = Address.fromString('{{PredyPool}}')
export const perpMarketAddress: Address = Address.fromString('{{PerpMarket}}')
export const predictMarketAddress: Address =
  Address.fromString('{{PredictMarket}}')
export const gammaTradeMarketAddress: Address = Address.fromString(
  '{{GammaTradeMarket}}'
)

export const predyPoolContract = PredyPool.bind(predyPoolAddress)
export const perpMarketContract = PerpMarket.bind(perpMarketAddress)
export const predictMarketContract = PerpMarket.bind(predictMarketAddress)
export const gammaTradeMarketContract = PerpMarket.bind(gammaTradeMarketAddress)
