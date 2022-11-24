import { Conexao } from './Conexao'

export class Transicao {
  id: number
  label: string
  status: boolean = false
  conexoesEntrada: Array<Conexao> = []
  conexoesSaida: Array<Conexao> = []

  constructor(id: number, label: string) {
    this.id = id
    this.label = label
  }

  public getId(): number {
    return this.id
  }

  public getLabel(): string {
    return this.label
  }

  public getStatus(): boolean {
    return this.status
  }

  public getConexoesEntrada(): Array<Conexao> {
    return this.conexoesEntrada
  }

  public getConexoesSaida(): Array<Conexao> {
    return this.conexoesSaida
  }

  public setStatus(status: boolean) {
    this.status = status
  }

  public addConexaoEntrada(conexao: Conexao): void {
    this.conexoesEntrada.push(conexao)
  }

  public removeConexaoEntrada(conexao: Conexao): void {
    let index = this.conexoesEntrada.indexOf(conexao)
    if (index > -1) {
      this.conexoesEntrada.splice(index, 1)
    } else {
      console.log(`removeConexaoDaTransicao: Nao existe conexao solicitada na 
             transicao ${this.getId()}`)
    }
  }

  public addConexaoSaida(conexao: Conexao): void {
    this.conexoesSaida.push(conexao)
  }

  public removeConexaoSaida(conexao: Conexao): void {
    let index = this.conexoesSaida.indexOf(conexao)
    if (index > -1) {
      this.conexoesSaida.splice(index, 1)
    } else {
      console.log(`removeConexaoDaTransicao: Nao existe conexao solicitada na 
             transicao ${this.getLabel()}`)
    }
  }

  public toString(): string {
    return (
      'Transição ' + this.getLabel() + ' possui o status ' + this.getStatus()
    )
  }
}
