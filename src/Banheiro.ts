import { atendenteCx1, atendenteCx2, scheduler, waiterPetriNet } from '.'
import { Process } from './Process'
import { Garcom } from './Garcom'

export class Banheiro extends Process {
  constructor(name: string, duration: () => number) {
    super(name, duration)
  }

  public canExecute() {
    const qtdAtendentesBanheiro =
      (waiterPetriNet.petriNet
        ?.getLugarByLabel('substituirCaixa')
        ?.getTokens() as number) +
      (waiterPetriNet.petriNet
        ?.getLugarByLabel('garcomNoCaixa')
        ?.getTokens() as number)

    if (
      qtdAtendentesBanheiro >=
      atendenteCx1.getQuantity() + atendenteCx2.getQuantity()
    ) {
      return false
    }
    return true
  }

  public executeOnStart() {
    waiterPetriNet.petriNet?.getLugarByLabel('substituirCaixa')?.insereToken(1)
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Garcom(
          'Garcom-Banheiro',
          () => scheduler.normal(4, 1),
          'garcomNoCaixa'
        )
      )
    )
  }

  public executeOnEnd() {
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Banheiro('Banheiro', () => scheduler.normal(15, 5))
      )
    )
  }
}
