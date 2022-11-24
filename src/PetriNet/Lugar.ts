export class Lugar {
  id: number
  tokens: number
  label: string

  constructor(id: number, label: string, tokens: number = 0) {
    this.id = id
    this.tokens = tokens
    this.label = label
  }

  public insereToken(qtdTokens: number) {
    this.tokens += qtdTokens
    console.log(`Adicionado ${qtdTokens} token(s) no ${this.getLabel()}`)
  }

  public removeToken(qtdTokens: number) {
    if (this.tokens >= qtdTokens) {
      this.tokens -= qtdTokens
      console.log(`Removido ${qtdTokens} token(s) do ${this.getLabel()}`)
    } else {
      console.log(
        `removeToken: Quantidade de tokens é insuficiente , no ${this.getLabel()}`
      )
    }
  }

  public clear() {
    this.tokens = 0
    console.log(`Resetado todos token(s) do ${this.getLabel()}`)
  }

  public getTokens(): number {
    return this.tokens
  }

  public getId(): number {
    return this.id
  }

  public getLabel(): string {
    return this.label
  }

  public toString(): string {
    return (
      'Lugar ' + this.getLabel() + ' possui ' + this.getTokens() + ' tokens'
    )
  }
}
