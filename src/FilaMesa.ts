import {
  bancosLivres,
  filaDeClientesNaMesa2,
  filaDeClientesNaMesa4,
  filaDeClientesNoBalcao,
  filaGarcomLimpaMesa2,
  filaGarcomLimpaMesa4,
  filaGarcomLimpaBalcao,
  mesas2Livres,
  mesas4Livres,
  scheduler,
  waiterPetriNet,
} from '.'
import { Entity } from './Entity'
import { Process } from './Process'
import { Garcom } from './Garcom'
import colors from 'colors'

export class FilaMesa extends Process {
  mesa: String = ''

  constructor(name: string, duration: () => number) {
    super(name, duration)
  }

  public canExecute() {
    if (this.name == 'FilaMesa-balcao') {
      if (!filaDeClientesNoBalcao.isEmpty() && bancosLivres.canAllocate(1)) {
        return true
      }
    } else if (this.name == 'FilaMesa-M2') {
      if (!filaDeClientesNaMesa2.isEmpty() && mesas2Livres.canAllocate(1)) {
        return true
      }
    } else {
      if (!filaDeClientesNaMesa4.isEmpty() && mesas4Livres.canAllocate(1)) {
        return true
      }
    }
    return false
  }

  public executeOnStart() {
    if (this.name == 'FilaMesa-balcao') {
      this.mesa = 'balcao'
      bancosLivres.allocate(1)
      scheduler.isDebbuger &&
        console.log(
          colors.blue(
            `Quantidade de bancos existentes --> ${colors.yellow(
              '' + bancosLivres.quantity
            )} e em uso ${colors.yellow('' + bancosLivres.used)} bancos`
          )
        )
      filaGarcomLimpaBalcao.insert(filaDeClientesNoBalcao.remove() as Entity)
    } else if (this.name == 'FilaMesa-M2') {
      this.mesa = 'M2'
      mesas2Livres.allocate(1)
      scheduler.isDebbuger &&
        console.log(
          colors.blue(
            `Quantidade de mesas2 existentes --> ${colors.yellow(
              '' + mesas2Livres.quantity
            )} e em uso ${colors.yellow('' + mesas2Livres.used)} mesas2`
          )
        )
      filaGarcomLimpaMesa2.insert(filaDeClientesNaMesa2.remove() as Entity)
    } else {
      this.mesa = 'M4'
      mesas4Livres.allocate(1)
      scheduler.isDebbuger &&
        console.log(
          colors.blue(
            `Quantidade de mesas4 existentes --> ${colors.yellow(
              '' + mesas4Livres.quantity
            )} e em uso ${colors.yellow('' + mesas4Livres.used)} mesas`
          )
        )
      filaGarcomLimpaMesa4.insert(filaDeClientesNaMesa4.remove() as Entity)
    }
    waiterPetriNet.petriNet?.getLugarByLabel('clienteVaiSentar')?.insereToken(1)
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Garcom(
          'Garcom-CleanTable-' + this.mesa,
          // () => scheduler.normal(0.1, 35, 14, 5),
          () => scheduler.normal(14, 5),
          'higienizandoMesa'
        )
      )
    )
  }
}
