package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"text/tabwriter"
	"time"
)

const (
	STRING_SEPARATOR = ","
)

type LugarType struct {
	Nome   string
	Marcas int
	Peso   int
}

type TransicaoType struct {
	Nome       string
	Habilitado bool
	Entradas   []*LugarType
	Saidas     []*LugarType
}

type RedeDePetriType struct {
	Lugares []LugarType
	Transicoes []TransicaoType
}

func main() {
	fmt.Printf(
		"SIMULAÇÃO E MODELAGEM DE SISTEMAS - TGA - Ernesto Lindstaedt\n" +
		"GRUPO: César Hoffmann e Vanessa Schenkel\n" +
		"----------------------------------------\n\n",
	)

	scanner := bufio.NewScanner(os.Stdin)

	// Quantos lugares: 3
	quantidadeLugares := scanInputsInt(scanner, "Quantos lugares?")
	lugares := iniciaLugares(quantidadeLugares)

	// Quantas transições: 2
	quantidadeTransicoes := scanInputsInt(scanner, "Quantas transições?")
	transicoes := iniciaTransicoes(quantidadeTransicoes)

	for i := 0; i < len(transicoes); i++ {
		// Quais são os lugares de entrada de T1? 1, 3
		// Quais são os lugares de entrada de T2? 2, 3
		lugaresDeEntrada := scanInputs(scanner, "Quais são os lugares de entrada de " + transicoes[i].Nome + "?")
		entradasSeparadas := splitStringIntoNumbers(lugaresDeEntrada)
		
		conexoesEntradaTransicao := []*LugarType{}
		for _, entrada := range entradasSeparadas {
			conexoesEntradaTransicao = append(conexoesEntradaTransicao, &lugares[entrada])
		}
		transicoes[i].Entradas = conexoesEntradaTransicao

		// Quais são os lugares de saida de T2? 2, 3
		lugaresDeSaida := scanInputs(scanner, "Quais são os lugares de saida de " + transicoes[i].Nome + "?")
		saidasSeparadas := splitStringIntoNumbers(lugaresDeSaida)

		conexoesSaidaTransicao := []*LugarType{}
		for _, saida := range saidasSeparadas {
			conexoesSaidaTransicao = append(conexoesSaidaTransicao, &lugares[saida])
		}

		for j := 0; j < len(transicoes[i].Entradas); j++ {
			// Quantas marcas em L1 ? 10
			// Quantas marcas em L2 ? 4
			// Quantas marcas em L3 ? 0
			marcas := scanInputsInt(scanner, "Quantas marcas em " + transicoes[i].Entradas[j].Nome + "?")
			transicoes[i].Entradas[j].Marcas = marcas
	
			// Qual o peso do arco de L1 para T1 ? 1
			// Qual o peso do arco de L3 para T1 ? 2
			peso := scanInputsInt(
				scanner,
				"Qual o peso do arco de " + transicoes[i].Entradas[j].Nome + " para " + transicoes[i].Nome + "?",
			)
			if peso < 1 {
				peso = 1;
			}
			transicoes[i].Entradas[j].Peso = peso
		}

		transicoes[i].Saidas = conexoesSaidaTransicao
	}

	redePetri := RedeDePetriType{
		Transicoes: transicoes,
		Lugares: lugares,
	}

	printRedePetri(redePetri)
}

func scanInputs(scanner *bufio.Scanner, question string) string {
	fmt.Println(question)
	scanner.Scan()
	stringInput := scanner.Text()

	return stringInput
}

func scanInputsInt(scanner *bufio.Scanner, question string) int {
	stringOuput := scanInputs(scanner, question)

	intOutput, err := strconv.Atoi(stringOuput)
	if err != nil {
		fmt.Printf("[scanInputsInt] Error when converting string [%s] to an int\n", stringOuput)
	}

	return intOutput
}

func splitStringIntoNumbers(entradas string) []int {
	entradasSeparadas := strings.Split(entradas, STRING_SEPARATOR)

	arrayDeNumeros := []int{}
	for _, entrada := range entradasSeparadas {
		numeroConvertido, err := strconv.Atoi(entrada)
		if err != nil {
			fmt.Printf("[splitStringIntoNumbers] Error when converting string [%s] to an int\n", entrada)
		}
		arrayDeNumeros = append(arrayDeNumeros, numeroConvertido)
	}

	return arrayDeNumeros
}

func printRedePetri(redePetri RedeDePetriType) {
	tabela := tabwriter.NewWriter(os.Stdout, 15, 0, 2, ' ', tabwriter.TabIndent)

	fmt.Printf("\nIniciando ciclos...\n\n")
	
	// Imprime cabeçalho da tabela
	<-time.After(time.Second * 2)
	printCabecalhoTabelaPetri(tabela, redePetri)

	// Imprime estado inicial
	linha := indiceCiclo(0)
	linha += dadosLugares(redePetri)
	linha += dadosTransicoes(redePetri)
	fmt.Fprintln(tabela, linha)
	tabela.Flush()
	
	// Imprime ciclo a ciclo
	for ciclo := 0; ; ciclo++ {
		transicoesAtivas := false
		<-time.After(time.Millisecond * 650)
		
		// Varre as transições para achar se há alguma ativa
		for t := 0; t < len(redePetri.Transicoes); t++ {
			marcasParaTransicionar := 0
			// Varre as entradas da transição para achar se há alguma marca
			for e := 0; e < len(redePetri.Transicoes[t].Entradas); e++ {
				redePetri.Transicoes[t].Habilitado = false
				if redePetri.Transicoes[t].Entradas[e].Marcas > 0 {
					redePetri.Transicoes[t].Habilitado = true

					if redePetri.Transicoes[t].Entradas[e].Peso >= redePetri.Transicoes[t].Entradas[e].Marcas {
						marcasParaTransicionar = redePetri.Transicoes[t].Entradas[e].Marcas
					} else {
						marcasParaTransicionar =
							redePetri.Transicoes[t].Entradas[e].Marcas - redePetri.Transicoes[t].Entradas[e].Peso
					}

					redePetri.Transicoes[t].Entradas[e].Marcas =
						redePetri.Transicoes[t].Entradas[e].Marcas - redePetri.Transicoes[t].Entradas[e].Peso
					transicoesAtivas = true
				}
			}

			// Distribui marcas, 1 por vez para cada saída na transição
			for s := 0; marcasParaTransicionar > 0; s++ {
				if s >= len(redePetri.Transicoes[t].Saidas) {
					s = 0
				}

				redePetri.Transicoes[t].Saidas[s].Marcas += 1
				marcasParaTransicionar -= 1
			}

			// Se já houver uma transição ativa, para o processo e pula para próximo ciclo
			if transicoesAtivas {
				break
			}
		}

		// Imprime linha
		linha := indiceCiclo(ciclo + 1)
		linha += dadosLugares(redePetri)
		linha += dadosTransicoes(redePetri)
		fmt.Fprintln(tabela, linha)
		tabela.Flush()

		// Encerra atividades caso não tenha mais nenhuma transição ativa
		if !transicoesAtivas {
			break
		}
	}
}

func printCabecalhoTabelaPetri(tabela *tabwriter.Writer, redePetri RedeDePetriType) {
	cabecalhoTabela := []string{"Núm. do ciclo"}
	for _, lugar := range redePetri.Lugares {
		cabecalhoTabela = append(cabecalhoTabela, "| "+lugar.Nome)
	}

	for _, transicao := range redePetri.Transicoes {
		cabecalhoTabela = append(cabecalhoTabela, "| "+transicao.Nome)
	}

	cabecalhoTabelado := strings.Join(cabecalhoTabela, "\t")
	fmt.Fprintln(tabela, cabecalhoTabelado)

	tabela.Flush()
}

func iniciaLugares(quant int) []LugarType {
	lugares := []LugarType{}
	for i := 1; i <= quant; i++ {
		nomeLugar := "L" + strconv.Itoa(i)
		novoLugar := LugarType{
			Nome: nomeLugar,
		}
		lugares = append(lugares, novoLugar)
	}
	
	return lugares
}

func iniciaTransicoes(quant int) []TransicaoType {
	transicoes := []TransicaoType{}
	for i := 1; i <= quant; i++ {
		nomeTransicao := "T" + strconv.Itoa(i)
		novaTransicao := TransicaoType{
			Nome: nomeTransicao,
		}
		transicoes = append(transicoes, novaTransicao)
	}
	
	return transicoes
}

func indiceCiclo(ciclo int) string {
	indiceCiclo := fmt.Sprintf("%d", ciclo)

	if ciclo == 0 {
		indiceCiclo += " (Inicial)"
	}
	indiceCiclo += "\t"

	return indiceCiclo
}

func dadosLugares(redePetri RedeDePetriType) string {
	// fmt.Printf(
	// 	"2. -------------------------\n" +
	// 	"lugares %+v\n",
	// 	redePetri.Lugares,
	// )

	// Marcas do Lugar
	linha := ""
	for m := 0; m < len(redePetri.Lugares); m++ {
		marca := redePetri.Lugares[m].Marcas
		marcaLugar := "-"
		if marca > 0 {
			marcaLugar = strconv.Itoa(marca)
		}
		linha += "| " + marcaLugar + " \t"
	}
	return linha
}

func dadosTransicoes(redePetri RedeDePetriType) string {
	// fmt.Printf(
	// 	"3. -------------------------\n" +
	// 	"transic %+v\n",
	// 	redePetri.Transicoes,
	// )
	
	// Transição habilitada?
	linha := ""
	for t := 0; t < len(redePetri.Transicoes); t++ {
		transicao := redePetri.Transicoes[t]

		transicaoHabilitada := "N"
		if transicao.Habilitado {
			transicaoHabilitada = "S"
		}
		linha += "| " + transicaoHabilitada + "\t"
	}
	return linha
}