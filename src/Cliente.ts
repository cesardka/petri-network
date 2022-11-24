import { randomInt } from 'crypto'
import {
  atendenteCx1,
  atendenteCx2,
  filaDeClientesNoCaixa1,
  filaDeClientesNoCaixa2,
  scheduler,
} from '.'
import { Entity } from './Entity'
import { Process } from './Process'
import { Caixa } from './Caixa'

export class Cliente extends Process {
  numCaixaDestino: number = 0
  constructor(name: string, duration: () => number) {
    super(name, duration)
  }

  public executeOnEnd() {
    const cliente = 'cliente' + randomInt(1, 5)

    if (
      filaDeClientesNoCaixa1.getSize() <= filaDeClientesNoCaixa2.getSize() &&
      atendenteCx1.getQuantity() - atendenteCx1.used <=
        atendenteCx2.getQuantity() - atendenteCx2.used
    ) {
      filaDeClientesNoCaixa1.insert(
        scheduler.createEntity(new Entity({ name: cliente }))
      )
      this.numCaixaDestino = 1
    } else {
      filaDeClientesNoCaixa2.insert(
        scheduler.createEntity(new Entity({ name: cliente }))
      )
      this.numCaixaDestino = 2
    }

    // Se auto agenda
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Cliente('Cliente', () => scheduler.exponential(3))
      )
    )

    // Inicia processo do caixa
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Caixa(
          'Caixa' + this.numCaixaDestino,
          () => scheduler.normal(8, 2),
          this.numCaixaDestino
        )
      )
    )
  }
}
