export class Lugar {
  id;
  tokens;
  label;

  constructor(id, label, tokens = 0) {
    this.id = id;
    this.tokens = tokens;
    this.label = label;
  }

  insereToken(qtdTokens) {
    this.tokens += qtdTokens;
    console.log(`Adicionado ${qtdTokens} token(s) no ${this.getLabel()}`);
  }

  removeToken(qtdTokens) {
    if (this.tokens >= qtdTokens) {
      this.tokens -= qtdTokens;
      console.log(`Removido ${qtdTokens} token(s) do ${this.getLabel()}`);
    } else {
      console.log(
        `removeToken: Quantidade de tokens é insuficiente , no ${this.getLabel()}`
      );
    }
  }

  clear() {
    this.tokens = 0;
    console.log(`Resetado todos token(s) do ${this.getLabel()}`);
  }

  getTokens() {
    return this.tokens;
  }

  getId() {
    return this.id;
  }

  getLabel() {
    return this.label;
  }

  toString() {
    return (
      "Lugar " + this.getLabel() + " possui " + this.getTokens() + " tokens"
    );
  }
}
