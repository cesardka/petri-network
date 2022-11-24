import {
  cozinheiros,
  filaDePedidosEntrandoCozinha,
  filaDePedidosEsperandoEntrega,
  scheduler,
} from '.'
import { Entity } from './Entity'
import { Process } from './Process'
import colors from 'colors'
import { Pedido } from './Pedido'

export class Cozinha extends Process {
  pedidoSendoPreparado: Entity | undefined

  constructor(name: string, duration: () => number) {
    super(name, duration)
  }

  public canExecute() {
    if (!filaDePedidosEntrandoCozinha.isEmpty() && cozinheiros.canAllocate(1)) {
      return true
    }
    return false
  }

  public executeOnStart() {
    cozinheiros.allocate(1)
    scheduler.isDebbuger &&
      console.log(
        colors.blue(
          `Quantidade de cozinheiros existentes --> ${colors.yellow(
            '' + cozinheiros.quantity
          )} e em uso ${colors.yellow('' + cozinheiros.used)} cozinheiros`
        )
      )
    this.pedidoSendoPreparado = filaDePedidosEntrandoCozinha.remove() as Entity
  }

  public executeOnEnd() {
    filaDePedidosEsperandoEntrega.insert(this.pedidoSendoPreparado as Entity)
    cozinheiros.release(1)
    scheduler.isDebbuger &&
      console.log(
        colors.blue(
          `Fim do cozimento possui ${cozinheiros.quantity} e em uso estão ${cozinheiros.used}`
        )
      )
  }
}
