import { RedePetri } from "./Petri/RedePetri";

export class RedePetriHandler {
  petriNet = null;

  createPetriNet() {
    console.log("\n### Criando Rede Petri ###\n");

    this.petriNet = new RedePetri();

    //-------- Lugares--------
    const lugar1 = this.petriNet.criaLugar(1, "garcomLivre");
    const lugar2 = this.petriNet.criaLugar(2, "substituirCaixa");
    const lugar3 = this.petriNet.criaLugar(3, "pedidoPronto");
    const lugar4 = this.petriNet.criaLugar(4, "clienteVaiSentar");
    const lugar5 = this.petriNet.criaLugar(5, "garcomNoCaixa");
    const lugar6 = this.petriNet.criaLugar(6, "levandoPedido");
    const lugar7 = this.petriNet.criaLugar(7, "higienizandoMesa");
    const lugar8 = this.petriNet.criaLugar(8, "atendenteVoltou");
    const lugar9 = this.petriNet.criaLugar(9, "pedidoEntregue");
    const lugar10 = this.petriNet.criaLugar(10, "mesaHigienizada");

    //-------- Transições--------
    const transicao1 = this.petriNet.criaTransicao(1, "T1");
    const transicao2 = this.petriNet.criaTransicao(2, "T2");
    const transicao3 = this.petriNet.criaTransicao(3, "T3");
    const transicao4 = this.petriNet.criaTransicao(4, "T4");
    const transicao5 = this.petriNet.criaTransicao(5, "T5");
    const transicao6 = this.petriNet.criaTransicao(6, "T6");

    //-------- Conexões--------
    this.petriNet.criaConexao(lugar1, transicao1, 1, true, false, false);
    this.petriNet.criaConexao(lugar1, transicao2, 1, true, false, false);
    this.petriNet.criaConexao(lugar1, transicao3, 1, true, false, false);
    this.petriNet.criaConexao(lugar1, transicao4, 1, false, false, false);
    this.petriNet.criaConexao(lugar1, transicao5, 1, false, false, false);
    this.petriNet.criaConexao(lugar1, transicao6, 1, false, false, false);
    this.petriNet.criaConexao(lugar2, transicao1, 1, true, false, false);
    this.petriNet.criaConexao(lugar3, transicao2, 1, true, false, false);
    this.petriNet.criaConexao(lugar4, transicao3, 1, true, false, false);
    this.petriNet.criaConexao(lugar5, transicao1, 1, false, false, false);
    this.petriNet.criaConexao(lugar5, transicao4, 1, true, false, false);
    this.petriNet.criaConexao(lugar6, transicao2, 1, false, false, false);
    this.petriNet.criaConexao(lugar6, transicao5, 1, true, false, false);
    this.petriNet.criaConexao(lugar7, transicao3, 1, false, false, false);
    this.petriNet.criaConexao(lugar7, transicao6, 1, true, false, false);
    this.petriNet.criaConexao(lugar8, transicao4, 1, true, false, false);
    this.petriNet.criaConexao(lugar9, transicao5, 1, true, false, false);
    this.petriNet.criaConexao(lugar10, transicao6, 1, true, false, false);

    console.log("\n--------\n");
  }
}
