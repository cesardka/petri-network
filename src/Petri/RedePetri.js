import Table from "cli-table";
import prompts from "prompts";

import { Conexao } from "./Conexao";
import { Lugar } from "./Lugar";
import { Transicao } from "./Transicao";

export class RedePetri {
  lugares = [];
  transicoes = [];
  conexoes = [];
  log = [];
  numCicloExecutados = 0;
  callbackTokenEntrandoEmLugar = {};
  callbackTokenSaindoEmLugar = {};
  callbackTransicao = {};

  init() {
    this.atualizaStatusTransicoes();
    this.registrarLogInicial();
  }

  // ##### METODOS LUGAR #####
  criaLugar(id, label = `L${id.toString()}`, tokens = 0) {
    const lugar = new Lugar(id, label, tokens);
    this.lugares.push(lugar);
    return lugar;
  }

  getLugar(id) {
    const lugar = this.lugares.filter((lugar) => lugar.getId() === id)[0];
    if (!lugar) {
      console.log(`getLugar com ID = ${id} não existe`);
      return null;
    }
    return lugar;
  }

  getLugarByLabel(label) {
    const lugar = this.lugares.filter((lugar) => lugar.getLabel() === label)[0];
    if (!lugar) {
      console.log(`getLugarByLabel com label = ${label} não existe`);
      return null;
    }
    return lugar;
  }

  removeLugar(id) {
    const lugar = this.getLugar(id);
    let index = lugar && this.lugares.indexOf(lugar);
    if (index) {
      this.lugares.splice(index, 1);
    } else {
      console.log(`removeLugar com ID ${id} não existe`);
    }
  }

  // ##### METODOS TRANSICAO #####
  criaTransicao(id, label = `T${id.toString()}`) {
    const transicao = new Transicao(id, label);
    this.transicoes.push(transicao);
    return transicao;
  }

  getTransicao(id) {
    const transicao = this.transicoes.filter(
      (transicao) => transicao.getId() === id
    )[0];
    if (!transicao) {
      console.log(`getTransicao com ID = ${id} não existe`);
      return null;
    }
    return transicao;
  }

  removeTransicao(id) {
    const transicao = this.getTransicao(id);
    const index = transicao && this.transicoes.indexOf(transicao);
    if (index) {
      this.transicoes.splice(index, 1);
    } else {
      console.log(`removeTransicao com ID ${id} não existe`);
    }
  }

  getStatusTransicao(id) {
    const transicao = this.getTransicao(id);
    return transicao ? transicao.getStatus() : false;
  }

  setTransicaoInativa(id) {
    const transicao = this.getTransicao(id);
    if (!transicao) {
      console.error("Transição não encontrada");
    }
    transicao?.setStatus(false);
  }

  setTransicaoAtiva(id) {
    const transicao = this.getTransicao(id);
    if (!transicao) {
      console.error("Transição não encontrada");
    }
    transicao?.setStatus(true);
  }

  isTransicaoAtiva(id) {
    const transicao = this.getTransicao(id);
    return transicao?.getStatus() === true;
  }

  // ##### METODOS CONEXAO #####
  criaConexao(
    lugar,
    transicao,
    peso,
    isEntrada,
    isConexaoInibidora,
    isConexaoReset
  ) {
    if (lugar && transicao) {
      this.conexoes.push(
        new Conexao(
          lugar,
          transicao,
          peso,
          isEntrada,
          isConexaoInibidora,
          isConexaoReset
        )
      );
      if (isEntrada) {
        transicao.addConexaoEntrada(this.conexoes[this.conexoes.length - 1]);
      } else {
        transicao.addConexaoSaida(this.conexoes[this.conexoes.length - 1]);
      }
      console.log(this.conexoes[this.conexoes.length - 1].toString());
    }
  }

  removeConexao(lugar, transicao) {
    for (let conexao of this.conexoes) {
      if (
        conexao.getLugar().getId() === lugar.getId() &&
        conexao.getTransicao().getId() === transicao.getId()
      ) {
        let index = this.conexoes.indexOf(conexao);
        if (index > -1) {
          if (conexao.getIsEntrada()) {
            conexao.getTransicao().removeConexaoEntrada(conexao);
          } else {
            conexao.getTransicao().removeConexaoSaida(conexao);
          }
          this.conexoes.splice(index, 1);
        } else {
          console.log(`removeConexao: Nao existe lugar com ID ${lugar.getId()} ou 
             transicao com ID ${transicao.getId()}`);
        }
      }
    }
  }

  getConexoes() {
    return this.conexoes;
  }

  getLugarDeConexao(conexao) {
    return conexao.getLugar();
  }

  getTransicaoDeConexao(conexao) {
    return conexao.getTransicao();
  }

  getConexoesEntrada(idTransicao) {
    const conexoesEntrada = [];
    for (let conexao of this.conexoes) {
      if (
        conexao.getTransicao().getId() === idTransicao &&
        conexao.getIsEntrada() === true
      ) {
        conexoesEntrada.push(conexao);
      }
    }
    return conexoesEntrada;
  }

  getConexoesSaida(idTransicao) {
    const conexoesSaida = [];
    for (let conexao of this.conexoes) {
      if (
        conexao.getTransicao().getId() === idTransicao &&
        conexao.getIsEntrada() === true
      ) {
        conexoesSaida.push(conexao);
      }
    }
    return conexoesSaida;
  }

  // ##### METODOS TOKEN #####
  insereTokenEmLugar(qtdTokens, lugar) {
    lugar?.insereToken(qtdTokens);
  }

  removeTokenDeLugar(qtdTokens, lugar) {
    lugar?.removeToken(qtdTokens);
  }

  clearLugar(lugar) {
    lugar?.clear();
  }

  getTokens(lugar) {
    return lugar.getTokens();
  }

  quantosTokens(idLugar) {
    let lugar = this.getLugar(idLugar);
    if (!lugar) {
      console.error("Lugar não encontrado");
    }
    return lugar?.getTokens();
  }

  embaralhaTransicoes(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  // ##### METODOS CICLO #####
  atualizaStatusTransicoes(transicoes = this.transicoes) {
    //verificar para cada transicao quais sao os lugares associados e se o token do lugar é suficiente para a conexão
    for (let transicao of transicoes) {
      for (let conexao of transicao.getConexoesEntrada()) {
        if (
          (!conexao.getIsConexaoInibidora() &&
            conexao.getLugar().getTokens() >= conexao.getPeso()) ||
          (conexao.getIsConexaoInibidora() &&
            conexao.getLugar().getTokens() < conexao.getPeso())
        ) {
          conexao.getTransicao().setStatus(true);
        } else {
          conexao.getTransicao().setStatus(false);
          break;
        }
      }
    }
  }

  executaCiclo() {
    const transicoesAtivas = this.transicoes.filter(
      (transicao) => transicao.status
    );

    if (transicoesAtivas.length < 1) {
      // console.log(
      //   'Não é possível executar um ciclo, pois nenhuma transição está ativa'
      // )
      return;
    }

    const transicoesEmbaralhadas = this.embaralhaTransicoes([
      ...transicoesAtivas,
    ]);

    // Move tokens de um lugar para o outro
    for (let transicao of transicoesEmbaralhadas) {
      while (transicao.getStatus()) {
        for (let conexao of transicao.getConexoesEntrada()) {
          this.executaCallbackTokenSaindo(conexao);
          if (conexao.getIsConexaoReset()) {
            conexao.getLugar().clear();
          } else if (!conexao.getIsConexaoInibidora()) {
            conexao.getLugar().removeToken(conexao.getPeso());
          }
        }

        this.executaCallbackTransicao(transicao);

        for (let conexao of transicao.getConexoesSaida()) {
          conexao.getLugar().insereToken(conexao.getPeso());
          this.executaCallbackTokenEntrando(conexao);
        }

        this.atualizaStatusTransicoes(transicoesEmbaralhadas);
      }
    }

    this.atualizaStatusTransicoes();

    this.registraLog(++this.numCicloExecutados);
  }

  // ##### Callbacks #####
  executaCallbackTokenEntrando(conexao) {
    // Valida se o lugar está atrelado a um callback
    // Verifica se a quantidade de tokens do lugar é
    // maior ou igual a qtdMinima pra então disparar o callback
    const idLugar = conexao.getLugar()?.id;
    if (
      idLugar &&
      this.callbackTokenEntrandoEmLugar[idLugar] &&
      conexao.getLugar().getTokens() >=
        this.callbackTokenEntrandoEmLugar[idLugar].qtdMinima
    ) {
      this.callbackTokenEntrandoEmLugar[idLugar].callback(
        conexao.getLugar().getTokens()
      );
    }
  }

  executaCallbackTokenSaindo(conexao) {
    // Valida se o lugar está atrelado a um callback
    // Verifica se a quantidade de tokens do lugar é
    // maior ou igual a qtdMinima pra então disparar o callback
    const idLugar = conexao.getLugar()?.id;
    if (
      idLugar &&
      this.callbackTokenSaindoEmLugar[idLugar] &&
      conexao.getLugar().getTokens() >=
        this.callbackTokenSaindoEmLugar[idLugar].qtdMinima
    ) {
      this.callbackTokenSaindoEmLugar[idLugar].callback(
        conexao.getLugar().getTokens()
      );
    }
  }

  executaCallbackTransicao(transicao) {
    if (transicao.id && this.callbackTransicao[transicao.id]) {
      this.callbackTransicao[transicao.id]();
    }
  }

  // insereCallbackTokenEntrandoLugar(L3, gisela())
  // insereCallbackTokenEntrandoLugar(L2, vitor())

  // callbackTokenEntrandoEmLugar = {
  //   L3: {
  //      callback: gisela,
  //      qtdMinima: 4
  // }

  insereCallbackTokenEntrandoLugar(lugar, callback, qtdTokens) {
    this.callbackTokenEntrandoEmLugar[lugar.id] = {
      callback,
      qtdMinima: qtdTokens,
    };
  }

  insereCallbackTokenSaindoLugar(lugar, callback, qtdTokens) {
    this.callbackTokenSaindoEmLugar[lugar.id] = {
      callback,
      qtdMinima: qtdTokens,
    };
  }

  insereCallbackTransicao(transicao, callback) {
    this.callbackTransicao[transicao.id] = callback;
  }

  // ##### METODOS DE LOG #####
  getSituacaoRede() {
    return [
      ...this.lugares.map((lugar) => lugar.getTokens().toString()),
      ...this.transicoes.map(
        (transicao) => `${transicao.getStatus() ? "S" : "N"}`
      ),
    ];
  }
  registrarLogInicial() {
    this.log.push([
      "Núm. do ciclo",
      ...this.lugares.map((lugar) => `${lugar.getLabel()}`),
      ...this.transicoes.map((transicao) => `${transicao.getLabel()}`),
    ]);

    this.registraLog("0 (inicial)");
  }
  registraLog(label) {
    this.log.push([label.toString(), ...this.getSituacaoRede()]);
  }

  // ##### METODOS EXIBIÇÃO #####
  exibeLugares() {
    const lugares = ["Lugar"];
    const marcacoes = ["Marcação"];

    for (const lugar of this.lugares) {
      lugares.push(lugar.getLabel());
      marcacoes.push(lugar.getTokens());
    }

    const table = new Table();
    table.push(lugares);
    table.push(marcacoes);

    console.log(table.toString());
  }
  exibeTransicoes() {
    const transicoes = ["Transição"];
    const habilitadas = ["Habilitada ?"];

    for (const transicao of this.transicoes) {
      transicoes.push(transicao.getLabel());
      habilitadas.push(transicao.getStatus() ? "S" : "N");
    }

    const table = new Table();
    table.push(transicoes);
    table.push(habilitadas);

    console.log(table.toString());
  }
  exibeRede() {
    const table = new Table();
    table.push(...this.log);
    console.log(table.toString());
  }

  exibeMenu() {
    while (true) {
      console.log("\n=== Execução ===");
      console.log("1. Executar ciclo");
      console.log("2. Exibir lugares");
      console.log("3. Exibir transições");
      console.log("4. Exibir rede");
      console.log("9. Sair");
      console.log();

      const option = prompts({ sigint: true })("");

      switch (option) {
        case "1":
          this.executaCiclo();
          this.exibeRede();
          break;
        case "2":
          this.exibeLugares();
          break;
        case "3":
          this.exibeTransicoes();
          break;
        case "4":
          this.exibeRede();
          break;
        case "9":
          console.log("Parando execução!");
          break;
        default:
          console.log("Opção inválida.");
          break;
      }

      if (option === "9") {
        break;
      }
    }
  }
}
