import { RandVarGen } from 'random-variate-generators'
import { Entity } from './Entity'
import { EntitySet } from './EntitySet'
import { Process } from './Process'
import { Resource } from './Resource'
import { v4 as uuid } from 'uuid'
import promptSync from 'prompt-sync'
import colors from 'colors'
import {
  cozinheiros,
  filaDeClientesComendoNaMesa2,
  filaDeClientesComendoNaMesa4,
  filaDeClientesComendoNoBalcao,
  filaDeClientesNaMesa2,
  filaDeClientesNaMesa4,
  filaDeClientesNoBalcao,
  filaDeClientesNoCaixa1,
  filaDeClientesNoCaixa2,
  filaDePedidosEntrandoCozinha,
  filaDePedidosEsperandoEntrega,
  filaDePedidosSendoPreparados,
} from '.'

const rvg = new RandVarGen()

const prompt = promptSync({ sigint: true })

type ProcessItem = {
  engineProcess: Process
  type: string
}
interface ProcessSchedule {
  [key: number]: ProcessItem[]
}
export class Scheduler {
  time: number
  processSchedule: ProcessSchedule = {}
  entityList: Entity[] = []
  resourceList: Resource[] = []
  processList: Process[] = []
  entitySetList: EntitySet[] = []
  destroyedEntities: Entity[] = []
  maxActiveEntities: number = 0
  isDebbuger: boolean = false
  executeSimulateOneStep: boolean = false

  constructor(public initialTime: number = 0) {
    this.time = initialTime
  }

  public getTime() {
    return this.time
  }

  public startProcessNow(process: Process) {
    this.isDebbuger && console.log('startProcessNow, com id:', process.getId())
    this.startProcessAt(process, this.time)
  }

  public startProcessIn(process: Process, timeToStart: number) {
    this.isDebbuger &&
      console.log(
        `startProcessIn, com id ${process.getId()} e timeToStart: ${timeToStart}`
      )
    this.startProcessAt(process, this.time + timeToStart)
  }

  public startProcessAt(engineProcess: Process, absoluteTime: number) {
    this.isDebbuger &&
      console.log(
        `startProcessAt, com id ${engineProcess.getId()} e absoluteTime: ${absoluteTime}`
      )

    if (this.processSchedule[absoluteTime]) {
      this.processSchedule = {
        ...this.processSchedule,
        [absoluteTime]: [
          ...this.processSchedule[absoluteTime],
          { engineProcess, type: 'start' },
        ],
      }
    } else {
      this.processSchedule = {
        ...this.processSchedule,
        [absoluteTime]: [{ engineProcess, type: 'start' }],
      }
    }
  }

  public async waitFor(time: number) {
    return new Promise(resolve => setTimeout(resolve, time * 1000))
  }

  private isProcessScheduleEmpty() {
    for (const processList of Object.values(this.processSchedule)) {
      if (processList.length !== 0) return false
    }
    return true
  }

  private async executeSimulation() {
    const nextTime = this.getNextTime()

    if (nextTime != this.time) {
      this.entitySetList.forEach(entitySet => entitySet.timeCallback(nextTime))
    }

    this.time = nextTime
    console.log(colors.bgBlue('TEMPO ATUAL: ' + this.time))

    while (this.processSchedule[this.time].length > 0) {
      if (this.isDebbuger) {
        const continueResult = prompt(
          colors.blue(
            '\nDeseja continuar (Enter para continuar, "N" para encerrar)? \n'
          )
        )

        if (continueResult.toUpperCase() === 'N') {
          console.log('Encerrando execução...')
          this.executeSimulateOneStep = false
          return
        }
      }

      const { engineProcess, type } = this.processSchedule[
        this.time
      ].shift() as ProcessItem

      if (type === 'start') {
        if (!engineProcess.canExecute()) {
          this.isDebbuger &&
            console.log(
              colors.blue(
                `\tSem recursos para executar processo: --> Process ${
                  engineProcess.name
                } com id ${engineProcess.getId()} e time: ${this.time}`
              )
            )

          if (this.processSchedule[this.time + 1]) {
            this.processSchedule[this.time + 1] = [
              ...this.processSchedule[this.time + 1],
              { engineProcess, type: 'start' },
            ]
          } else {
            this.processSchedule[this.time + 1] = [
              { engineProcess, type: 'start' },
            ]
          }
          continue
        }

        engineProcess.executeOnStart()
        const duration = engineProcess?.duration() || this.time

        this.isDebbuger &&
          console.log(
            `\t${colors.blue('ExecuteOnStart():')} --> Process ${colors.blue(
              `${engineProcess.name}`
            )} com id ${colors.blue(
              `${engineProcess.getId()}`
            )} e time:  ${colors.blue(`${this.time}`)}`
          )

        const endTime = this.time + duration
        if (this.processSchedule[endTime]) {
          this.processSchedule[endTime] = [
            ...this.processSchedule[endTime],
            { engineProcess, type: 'end' },
          ]
        } else {
          this.processSchedule[endTime] = [{ engineProcess, type: 'end' }]
        }
      } else {
        engineProcess.executeOnEnd()

        this.isDebbuger &&
          console.log(
            `\t${colors.blue('ExecuteOnEnd():')}  --> Process ${colors.blue(
              `${engineProcess.name}`
            )} com id ${colors.blue(
              `${engineProcess.getId()}`
            )} e time:  ${colors.blue(`${this.time}`)}`
          )
      }

      const sortedSchedule = Object.keys(this.processSchedule).sort(sorter)

      const printSchedule = sortedSchedule.map(key => {
        const elements: ProcessItem[] = this.processSchedule[key]

        let line = `${key} -> [`

        for (const element of elements) {
          line += `{ ${element.engineProcess.name} | ${element.engineProcess.id} | Type: ${element.type} } | `
        }

        return line + ' ]'
      })
      console.log(colors.blue('processSchedule --> '), printSchedule)
    }

    if (Object.values(this.processSchedule[this.time]).length === 0) {
      delete this.processSchedule[this.time]
    }
  }

  public simulate() {
    while (!this.isProcessScheduleEmpty()) {
      this.executeSimulation()
    }
    this.showSummary()
    process.exit(0)
  }

  public simulateOneStep() {
    this.isDebbuger = true
    this.executeSimulateOneStep = true
    while (this.executeSimulateOneStep) {
      this.executeSimulation()
    }
    this.isDebbuger = false
    this.showSummary()
    process.exit(0)
  }

  public simulateBy(duration: number) {
    const finalTime = duration + this.time
    this.simulateUntil(finalTime)
    process.exit(0)
  }

  public simulateUntil(absoluteTime: number) {
    while (true) {
      if (this.getNextTime() > absoluteTime) break
      this.executeSimulation()
    }
    this.showSummary()
    process.exit(0)
  }

  public createEntity(entity: Entity): Entity {
    entity.setId(uuid())
    entity.setCreationTime(this.time)
    this.isDebbuger &&
      console.log(
        `createEntity, com id ${entity.getId()} e creationTime ${this.time}`
      )
    this.entityList.push(entity)

    if (this.maxActiveEntities < this.entityList.length) {
      this.maxActiveEntities = this.entityList.length
    }

    return entity
  }

  public destroyEntity(id: string) {
    this.isDebbuger && console.log(`destroyEntity, com id ${id}`)
    const entityIndex = this.entityList.findIndex(entity => entity.id === id)
    const [detroyedEntity] = this.entityList.splice(entityIndex, 1)
    detroyedEntity?.setDestroyedTime(this.time)
    this.destroyedEntities.push(detroyedEntity)
  }

  public getEntity(id: string) {
    const entity = this.entityList.find(entity => entity.getId() === id)

    if (!entity) {
      console.error(colors.blue(`getEntity: entity com ID ${id} nao existe`))
    }

    this.isDebbuger && console.log(`getEntity, com id ${id}`)

    return entity
  }

  public createResource(resource: Resource) {
    resource.setId(uuid())
    this.resourceList.push(resource)
    this.isDebbuger && console.log(`createResource, com id ${resource.getId()}`)
    return resource
  }

  public getResource(id: string) {
    const resource = this.resourceList.find(resource => resource.getId() === id)

    if (!resource) {
      console.error(
        colors.blue(`getResource: resource com ID ${id} nao existe`)
      )
    }

    this.isDebbuger && console.log(`getResource, com id ${id}`)
    return resource
  }

  public createProcess(process: Process): Process {
    process.setId(uuid())
    this.processList.push(process)
    this.isDebbuger && console.log(`createProcess, com id ${process.getId()}`)
    return process
  }

  public getProcess(processId: string): Process | undefined {
    const process = this.processList.find(
      process => process.getId() === processId
    )

    if (!process) {
      console.error(
        colors.blue(`getProcess: Processo com ID ${processId} nao existe`)
      )
    }

    this.isDebbuger && console.log(`getProcess, com id ${processId}`)

    return process
  }

  public createEntitySet(entitySet: EntitySet): EntitySet {
    entitySet.setId(uuid())
    this.entitySetList.push(entitySet)
    this.isDebbuger &&
      console.log(`createEntitySet, com id ${entitySet.getId()}`)
    return entitySet
  }

  public getEntitySet(id: string) {
    const entitySet = this.entitySetList.find(
      entitySet => entitySet.getId() === id
    )

    if (!entitySet) {
      console.error(
        colors.blue(`getEntitySet: entitySet com ID ${id} nao existe`)
      )
    }

    this.isDebbuger && console.log(`getEntitySet, com id ${id}`)

    return entitySet
  }

  public uniform(minValue: number, maxValue: number) {
    const uniformResult = rvg.uniform(minValue, maxValue)
    this.isDebbuger &&
      console.log(
        `Calculou uniform com minValue = ${minValue}, maxValue = ${maxValue}, e resultado = ${uniformResult}`
      )
    return uniformResult
  }

  public exponential(meanValue: number) {
    const expoResult = rvg.exponential(meanValue)
    this.isDebbuger &&
      console.log(
        `Calculou exponencial com meanValue = ${meanValue} e resultado = ${expoResult}`
      )
    return expoResult
  }

  public normal(meanValue: number, stdDeviationValue: number) {
    let normalResult = rvg.normal(meanValue, stdDeviationValue)
    while (normalResult < 0) {
      normalResult = rvg.normal(meanValue, stdDeviationValue)
    }
    this.isDebbuger &&
      console.log(
        `Calculou normal com meanValue = ${meanValue}, stdDeviationValue = ${stdDeviationValue} e resultado = ${normalResult}`
      )
    return normalResult
  }

  public getEntityTotalQuantity() {
    return this.entityList.length + this.destroyedEntities.length
  }

  public getActiveEntityTotalQuantity() {
    return this.entityList.length
  }

  public getDestroyedEntityTotalQuantity() {
    return this.destroyedEntities.length
  }

  public getEntityTotalQuantityByName(name: string) {
    return this.entityList.filter(entity => entity.name === name).length
  }

  public averageTimeInModel() {
    let total = 0
    for (const entity of this.destroyedEntities) {
      total += entity.destroyedTime - entity.creationTime
    }

    return total / (this.destroyedEntities.length || 1)
  }

  public maxEntitiesPresent() {
    return this.maxActiveEntities
  }

  public getNextTime() {
    return Object.keys(this.processSchedule)
      .map(parseFloat)
      .sort((a, b) => a - b)[0]
  }

  public getTotalDuration(): number {
    return this.time - this.initialTime
  }

  public showSummary() {
    console.log('\n------ RESUMO DA EXECUÇÃO ------\n')
    console.log('Simulation duration:', this.getTotalDuration())
    console.log('Total de Entidades Criadas:', this.getEntityTotalQuantity())
    console.log(
      'Total de Entidades Ativas:',
      this.getActiveEntityTotalQuantity()
    )
    console.log(
      'Total de Entidades Destruídas:',
      this.getDestroyedEntityTotalQuantity()
    )
    console.log(
      'Tempo Médio das Entidades no Modelo:',
      this.averageTimeInModel()
    )
    console.log(
      'Número Máximo de Entidades no Modelo:',
      this.maxEntitiesPresent()
    )

    console.log('Log Fila Caixa 1:', filaDeClientesNoCaixa1.getLog())
    console.log(
      'Tempo Médio Fila Caixa 1:',
      filaDeClientesNoCaixa1.averageTimeInSet()
    )
    console.log('Log Fila Caixa 2:', filaDeClientesNoCaixa2.getLog())
    console.log(
      'Log Pedidos Entrando na Cozinha:',
      filaDePedidosEntrandoCozinha.getLog()
    )
    console.log(
      'Tempo Médio Pedidos Entrando na Cozinha:',
      filaDePedidosEntrandoCozinha.averageTimeInSet()
    )
    console.log(
      'Log Pedidos Sendo Preparados:',
      filaDePedidosSendoPreparados.getLog()
    )
    console.log(
      'Log Pedidos Esperando entrega:',
      filaDePedidosEsperandoEntrega.getLog()
    )
    console.log(
      `${cozinheiros.getUsed()} de ${cozinheiros.getQuantity()} Cozinheiros em uso`
    )
    console.log(
      'Log de clientes na fila do balcão:',
      filaDeClientesNoBalcao.getLog()
    )
    console.log(
      'Log de clientes na fila da mesa de 2 lugares:',
      filaDeClientesNaMesa2.getLog()
    )
    console.log(
      'Log de clientes na fila da mesa de 4 lugares:',
      filaDeClientesNaMesa4.getLog()
    )
    console.log(
      'Log de clientes comendo no balcão:',
      filaDeClientesComendoNoBalcao.getLog()
    )
    console.log(
      'Log de clientes comendo na mesa de 2 lugares:',
      filaDeClientesComendoNaMesa2.getLog()
    )
    console.log(
      'Log de clientes comendo na mesa de 4 lugares:',
      filaDeClientesComendoNaMesa4.getLog()
    )
  }
}

export const sorter = (a: string, b: string) => {
  let numA = Number(a)
  let numB = Number(b)
  if (numA < numB) {
    return -1
  } else if (numA > numB) {
    return 1
  }
  return 0
}
