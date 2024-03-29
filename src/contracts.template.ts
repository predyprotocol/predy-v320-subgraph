import { Address } from '@graphprotocol/graph-ts'
import { Controller } from '../generated/Controller/Controller'
import { GammaShortStrategy } from '../generated/WethGammaShortStrategy/GammaShortStrategy'

export const controllerAddress: Address = Address.fromString('{{Controller}}')
export const wethGammaShortStrategyAddress: Address = Address.fromString(
  '{{WethGammaShortStrategy}}'
)

export const controllerContract = Controller.bind(controllerAddress)
export const wethGammaShortStrategyContract = GammaShortStrategy.bind(
  wethGammaShortStrategyAddress
)

export const StrategyStartBlock = {{ strategyStartBlock }}