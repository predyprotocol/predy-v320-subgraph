import { Address } from '@graphprotocol/graph-ts'
import { Controller } from '../generated/Controller/Controller'
import { GammaShortStrategy } from '../generated/GammaShortStrategy/GammaShortStrategy'

export const controllerAddress: Address = Address.fromString('{{Controller}}')
export const wethGammaShortStrategyAddress: Address = Address.fromString(
  '{{WethGammaShortStrategy}}'
)
export const wbtcGammaShortStrategyAddress: Address = Address.fromString(
  '{{WbtcGammaShortStrategy}}'
)

export const controllerContract = Controller.bind(controllerAddress)
export const wethGammaShortStrategyContract = GammaShortStrategy.bind(
  wethGammaShortStrategyAddress
)
export const wbtcGammaShortStrategyContract = GammaShortStrategy.bind(
  wbtcGammaShortStrategyAddress
)
