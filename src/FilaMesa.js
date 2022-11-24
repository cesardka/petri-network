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
  garcom,
} from "../..";
import { Process } from "./Process";
import { Garcom } from "./Garcom";

export class FilaMesa extends Process {
  mesa = "";

  constructor(name, duration) {
    super(name, duration);
  }

  canExecute() {
    if (this.name == "FilaMesa-balcao") {
      if (!filaDeClientesNoBalcao.isEmpty() && bancosLivres.canAllocate(1)) {
        return true;
      }
    } else if (this.name == "FilaMesa-M2") {
      if (!filaDeClientesNaMesa2.isEmpty() && mesas2Livres.canAllocate(1)) {
        return true;
      }
    } else {
      if (!filaDeClientesNaMesa4.isEmpty() && mesas4Livres.canAllocate(1)) {
        return true;
      }
    }
    return false;
  }

  executeOnStart() {
    if (this.name == "FilaMesa-balcao") {
      this.mesa = "balcao";
      bancosLivres.allocate(1);
      scheduler.isDebbuger &&
        console.log(
          `Quantidade de bancos existentes: ${bancosLivres.quantity}. Sendo usados:  ${bancosLivres.used}`
        );
      filaGarcomLimpaBalcao.insert(filaDeClientesNoBalcao.remove());
    } else if (this.name == "FilaMesa-M2") {
      this.mesa = "M2";
      mesas2Livres.allocate(1);
      scheduler.isDebbuger &&
        console.log(
          `Quantidade de mesas2 existentes: ${mesas2Livres.quantity}. Sendo usadas: ${mesas2Livres.used}`
        );
      filaGarcomLimpaMesa2.insert(filaDeClientesNaMesa2.remove());
    } else {
      this.mesa = "M4";
      mesas4Livres.allocate(1);
      scheduler.isDebbuger &&
        console.log(
          `Quantidade de mesas4 existentes ${mesas4Livres.quantity}. Sendo usadas: ${mesas4Livres.used}`
        );
      filaGarcomLimpaMesa4.insert(filaDeClientesNaMesa4.remove());
    }
    garcom.petriNet?.getLugarByLabel("clienteVaiSentar")?.insereToken(1);
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Garcom(
          "Garcom-CleanTable-" + this.mesa,
          () => scheduler.normal(14, 5),
          "higienizandoMesa"
        )
      )
    );
  }
}
