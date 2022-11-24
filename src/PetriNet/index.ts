import { RedePetri } from './RedeDePetri'

// CALLBACKS
const entrouNoLugar = (qtdTokens: number) =>
  console.log(`ENTROU NO LUGAR COM ${qtdTokens} tokens`)

const saiuDoLugar = (qtdTokens: number) =>
  console.log(`SAIU DO LUGAR COM ${qtdTokens} tokens`)

const trasicaoDisparada = () => console.log('DISPAROU TRANSIÇÃO')

// INICIO DA EXECUÇÃO DA REDE
console.log('Bem vindo à Rede de Petri em TypeScript! :)')

const rede = new RedePetri()

const prompt = require('prompt-sync')({ sigint: true })

const qtdLugares: number = Number(prompt('Quantos Lugares: '))

// instancia todos os lugares
for (let i = 1; i <= qtdLugares; i++) {
  rede.criaLugar(i)

  const lugar = rede.getLugar(i)
  lugar && rede.insereCallbackTokenEntrandoLugar(lugar, entrouNoLugar, 2)
  lugar && rede.insereCallbackTokenSaindoLugar(lugar, saiuDoLugar, 2)
}

const qtdTransicoes: number = Number(prompt('Quantas transições: '))

// instancia todas as transicoes pra cada lugar
for (let i = 1; i <= qtdTransicoes; i++) {
  const lugarEntradaTransicao: string = prompt(
    `Quais são os lugares de entrada de T${i}? `
  )
  const lugaresEntrada = lugarEntradaTransicao.split(',')

  const lugaresComConexaoInibidora: string = prompt(
    `Quais são os lugares de entrada de T${i} com conexão inibidora? `
  )
  const lugaresConexaoInibidora = lugaresComConexaoInibidora.split(',')

  const lugaresComConexaoReset: string = prompt(
    `Quais são os lugares de entrada de T${i} com conexão reset? `
  )
  const lugaresConexaoReset = lugaresComConexaoReset.split(',')

  rede.criaTransicao(i)

  const transicao = rede.getTransicao(i)
  transicao && rede.insereCallbackTransicao(transicao, trasicaoDisparada)

  for (let entrada of lugaresEntrada) {
    const ehInibidora = !!lugaresConexaoInibidora.find(elem => elem === entrada)
    const ehReset = !!lugaresConexaoReset.find(elem => elem === entrada)

    if (Number.isNaN(Number(entrada))) {
      console.log('As entradas devem ser fornecidas como números inteiros')
    }

    rede.criaConexao(
      rede.getLugar(Number(entrada)),
      rede.getTransicao(i),
      1,
      true,
      ehInibidora,
      ehReset
    ) //conecta lugar de entrada
  }

  const lugarSaidaTransicao: string = prompt(
    `Quais são os lugares de saída de T${i}? `
  )
  const lugarSaida = lugarSaidaTransicao.split(',')

  for (let saida of lugarSaida) {
    rede.criaConexao(
      rede.getLugar(Number(saida)),
      rede.getTransicao(i),
      1,
      false,
      false,
      false
    ) //conecta lugar de saida
  }
}

// ver marcas pra cada lugar
for (let i = 1; i <= qtdLugares; i++) {
  const qtdTokens: number = Number(prompt(`Quantas marcas em L${i}? `))

  rede.insereTokenEmLugar(qtdTokens, rede.getLugar(i))
}

const conexoes = rede.getConexoes()

// ver pesos pra cada conexao
for (let i = 0; i < conexoes.length; i++) {
  const lugarConexao = rede.getLugarDeConexao(conexoes[i])
  const transicaoConexao = rede.getTransicaoDeConexao(conexoes[i])

  const peso: number = Number(
    prompt(
      `Qual o peso do arco de L${lugarConexao.id} para T${transicaoConexao.id}? `
    )
  )
  conexoes[i].setPeso(peso)
}

rede.init()
rede.exibeMenu()
