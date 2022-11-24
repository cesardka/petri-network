export class Conexao {
  lugar;
  transicao;
  peso;
  isEntrada;
  isConexaoInibidora;
  isConexaoReset;

  constructor(
    lugar,
    transicao,
    peso,
    isEntrada,
    isConexaoInibidora,
    isConexaoReset
  ) {
    this.lugar = lugar;
    this.transicao = transicao;
    this.peso = peso;
    this.isEntrada = isEntrada;
    this.isConexaoInibidora = isConexaoInibidora;
    this.isConexaoReset = isConexaoReset;
  }

  getLugar() {
    return this.lugar;
  }

  getTransicao() {
    return this.transicao;
  }

  getPeso() {
    return this.peso;
  }

  setPeso(novoPeso) {
    this.peso = novoPeso;
  }

  getIsEntrada() {
    return this.isEntrada;
  }
  getIsConexaoInibidora() {
    return this.isConexaoInibidora;
  }

  getIsConexaoReset() {
    return this.isConexaoReset;
  }

  toString() {
    return (
      this.getLugar().toString() +
      " " +
      this.getTransicao().toString() +
      " é entrada --> " +
      this.getIsEntrada() +
      " é inibidora --> " +
      this.getIsConexaoInibidora() +
      " é reset --> " +
      this.getIsConexaoReset()
    );
  }
}
