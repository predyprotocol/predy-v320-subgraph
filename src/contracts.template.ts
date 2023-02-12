import { Address } from '@graphprotocol/graph-ts'
import { Controller } from '../generated/Controller/Controller'
import { UniswapV3Pool } from '../generated/UniswapV3Pool/UniswapV3Pool'

{{#assets}}
export const controllerAddress: Address = Address.fromString(
  "{{Controller}}"
)

export const uniswapV3PoolAddress: Address = Address.fromString(
  "{{UniswapV3Pool}}"
)

export const controllerContract = Controller.bind(controllerAddress)

export const uniswapV3PoolContract = UniswapV3Pool.bind(uniswapV3PoolAddress)
{{/assets}}