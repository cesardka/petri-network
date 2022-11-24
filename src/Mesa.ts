import {
  bancosLivres,
  filaDeClientesComendoNaMesa2,
  filaDeClientesComendoNaMesa4,
  filaDeClientesComendoNoBalcao,
  mesas2Livres,
  mesas4Livres,
  scheduler,
} from '.'
import { Process } from './Process'
import colors from 'colors'

export class Mesa extends Process {
  constructor(name: string, duration: () => number) {
    super(name, duration)
  }

  public executeOnEnd() {
    var cliente = null
    if (this.name == 'Mesa-balcao') {
      cliente = filaDeClientesComendoNoBalcao.remove()
      bancosLivres.release(1)
    } else if (this.name == 'Mesa-M2') {
      cliente = filaDeClientesComendoNaMesa2.remove()
      mesas2Livres.release(1)
    } else {
      cliente = filaDeClientesComendoNaMesa4.remove()
      mesas4Livres.release(1)
    }
    scheduler.destroyEntity(cliente?.getId() as string)

    // Log fundamental para o funcionamento da rede, não mexer!!!
    console.log(colors.rainbow('\nMais clientes satisfeitos!!!\n'))
  }
}
