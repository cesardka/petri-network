export class Transicao {
  id;
  label;
  status = false;
  conexoesEntrada = [];
  conexoesSaida = [];

  constructor(id, label) {
    this.id = id;
    this.label = label;
  }

  getId() {
    return this.id;
  }

  getLabel() {
    return this.label;
  }

  getStatus() {
    return this.status;
  }

  getConexoesEntrada() {
    return this.conexoesEntrada;
  }

  getConexoesSaida() {
    return this.conexoesSaida;
  }

  setStatus(status) {
    this.status = status;
  }

  addConexaoEntrada(conexao) {
    this.conexoesEntrada.push(conexao);
  }

  removeConexaoEntrada(conexao) {
    let index = this.conexoesEntrada.indexOf(conexao);
    if (index > -1) {
      this.conexoesEntrada.splice(index, 1);
    } else {
      console.log(`removeConexaoDaTransicao: Nao existe conexao solicitada na 
             transicao ${this.getId()}`);
    }
  }

  addConexaoSaida(conexao) {
    this.conexoesSaida.push(conexao);
  }

  removeConexaoSaida(conexao) {
    let index = this.conexoesSaida.indexOf(conexao);
    if (index > -1) {
      this.conexoesSaida.splice(index, 1);
    } else {
      console.log(`removeConexaoDaTransicao: Nao existe conexao solicitada na 
             transicao ${this.getLabel()}`);
    }
  }

  toString() {
    return (
      "Transição " + this.getLabel() + " possui o status " + this.getStatus()
    );
  }
}
