import {
  filaDeClientesEsperandoPedidoNaMesa2,
  filaDeClientesEsperandoPedidoNaMesa4,
  filaGarcomLimpaMesa2,
  filaGarcomLimpaMesa4,
  filaDeClientesEsperandoPedidoNoBalcao,
  filaGarcomLimpaBalcao,
  scheduler,
  garcom,
  filaDeClientesComendoNaMesa2,
  filaDeClientesComendoNaMesa4,
  filaDeClientesComendoNoBalcao,
} from "./index";
import { Process } from "./Process";
import { PedidoGarcom } from "./PedidoGarcom";
import { Mesa } from "./Mesa";

export class Garcom extends Process {
  local = "";
  mesa = "";
  constructor(name, duration, local) {
    super(name, duration);
    this.local = local;
  }

  executeOnStart() {
    garcom.petriNet?.atualizaStatusTransicoes();
    garcom.petriNet?.executaCiclo();
    scheduler.isDebbuger &&
      console.log(
        `Garçons livres => ${garcom.petriNet
          ?.getLugarByLabel("garcomLivre")
          ?.getTokens()}`
      );
  }

  executeOnEnd() {
    if (this.local === "garcomNoCaixa") {
      garcom.petriNet?.getLugarByLabel("atendenteVoltou")?.insereToken(1);
    } else if (this.local === "levandoPedido") {
      garcom.petriNet?.getLugarByLabel("pedidoEntregue")?.insereToken(1);
      if (this.name === "Garcom-DeliverOrder-balcao") {
        filaDeClientesComendoNoBalcao.insert(
          filaDeClientesEsperandoPedidoNoBalcao.remove()
        );
        this.mesa = "balcao";
      } else if (this.name === "Garcom-DeliverOrder-M2") {
        filaDeClientesComendoNaMesa2.insert(
          filaDeClientesEsperandoPedidoNaMesa2.remove()
        );
        this.mesa = "M2";
      } else {
        filaDeClientesComendoNaMesa4.insert(
          filaDeClientesEsperandoPedidoNaMesa4.remove()
        );
        this.mesa = "M4";
      }
      scheduler.startProcessNow(
        scheduler.createProcess(
          new Mesa("Mesa-" + this.mesa, () => scheduler.normal(20, 8))
        )
      );
    } else if (this.local === "higienizandoMesa") {
      garcom.petriNet?.getLugarByLabel("mesaHigienizada")?.insereToken(1);
      if (this.name === "Garcom-CleanTable-balcao") {
        filaDeClientesEsperandoPedidoNoBalcao.insert(
          filaGarcomLimpaBalcao.remove()
        );
        this.mesa = "balcao";
      } else if (this.name === "Garcom-CleanTable-M2") {
        filaDeClientesEsperandoPedidoNaMesa2.insert(
          filaGarcomLimpaMesa2.remove()
        );
        this.mesa = "M2";
      } else {
        filaDeClientesEsperandoPedidoNaMesa4.insert(
          filaGarcomLimpaMesa4.remove()
        );
        this.mesa = "M4";
      }
      scheduler.startProcessNow(
        scheduler.createProcess(
          new PedidoGarcom("PedidoGarcom-" + this.mesa, () => 1)
        )
      );
    }
    garcom.petriNet?.atualizaStatusTransicoes();
    garcom.petriNet?.executaCiclo();
  }
}
