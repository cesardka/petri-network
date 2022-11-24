import colors from 'colors'
import { Entity } from './Entity'
import { scheduler } from '.'
import { randomInteger } from './utils/math'

export const enum Mode {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  P_BASED = 'P_BASED', // priority based
  NONE = 'NONE', // if none, método remove() sorteia qual entidade será removida. Utilizar removeById(id)
}

interface TimeInSet {
  [key: string]: {
    duration: number
    creation: number
  }
}

interface Log {
  time: number
  size: number
}

export class EntitySet {
  id: string | null
  name: string
  mode: Mode
  set: Entity[]
  maxPossibleSize: number // 0 caso não tenha limite

  setSize: number[]
  setTime: TimeInSet
  log: Log[]
  isRunningLog: boolean
  timeGap: number
  lastLogTime: number

  constructor(name: string, mode: Mode, maxPossibleSize: number) {
    this.id = null
    this.name = name
    this.mode = mode
    this.maxPossibleSize = maxPossibleSize
    this.set = []
    this.setSize = []
    this.setTime = {}
    this.log = []
    this.isRunningLog = false
    this.timeGap = 0
    this.lastLogTime = 0
  }

  /**
   * getId()
   * @returns EntitySet id
   */
  public getId() {
    return this.id
  }

  /**
   * getMode()
   * @returns Modo da fila EntitySet
   */
  public getMode() {
    return this.mode
  }

  /**
   * getEntitySet()
   * @returns fila EntitySet
   */
  public getEntitySet() {
    return this.set
  }

  /**
   * setMode()
   * @returns define o modo da fila EntitySet
   */
  public setMode(mode: Mode) {
    this.mode = mode
  }

  /**
   * setId()
   * @param id - Id da EntitySet
   */
  public setId(id: string) {
    this.id = id
  }

  /**
   * insert(Entity)
   * @returns Insere entidade na EntitySet
   */
  public insert(entity: Entity) {
    if (this.isFull()) {
      console.error(colors.red('EntitySet is full'))
      return
    }
    if (!entity.id) {
      console.error(colors.red('Id not setted in entity'))
      return
    }

    switch (this.mode) {
      case Mode.FIFO:
      case Mode.NONE:
        this.set.push(entity)
        break
      case Mode.LIFO:
        this.set.unshift(entity)
        break
      case Mode.P_BASED:
        if (entity.priority >= 0 && entity.priority <= 255) {
          this.set.push(entity)
          this.set.sort((a, b) => a.priority - b.priority)
        } else {
          console.error(
            colors.red(
              `insert() priority based: Prioridade inválida (${entity.getPriority()}) na entidade com id = ${entity.getId()} `
            )
          )
        }
        break
    }

    this.setTime[entity.id] = {
      duration: 0,
      creation: scheduler.getTime(),
    }

    this.updateSetSize()
  }

  /**
   * remove()
   * @returns Remove da lista
   */
  public remove() {
    let entityRemoved

    switch (this.mode) {
      case Mode.FIFO:
      case Mode.LIFO:
      case Mode.P_BASED:
        entityRemoved = this.set.shift()
        break
      case Mode.NONE:
        const rand = randomInteger(0, this.set.length - 1)
        entityRemoved = this.removeById(this.set[rand].getId() as string)

        break
    }

    scheduler.isDebbuger &&
      console.log(
        'remove-entitySet: Entity name --> ',
        entityRemoved?.getName(),
        'Entity id --> ',
        entityRemoved?.getId()
      )

    if (!entityRemoved || !entityRemoved.id) {
      console.error(colors.red('Unable to remove Entity'))
      return
    }

    this.updateSetSize()

    const entityTime = this.setTime[entityRemoved.id]

    entityTime.duration = scheduler.getTime() - entityTime.creation
    console.log(`entityRemoved.getName()`, entityRemoved.getName())
    console.log(`scheduler.getTime()`, scheduler.getTime())
    console.log(`entityTime.creation`, entityTime.creation)

    return entityRemoved
  }

  /**
   * removeById(id)
   * @returns Remove uma entidade específica da lista
   */
  public removeById(id: string): Entity | null {
    const index = this.set.findIndex(entity => entity.id === id)
    const [removed] = this.set.splice(index, 1)

    if (!removed || !removed.id) {
      console.error(colors.red('Unable to remove Entity'))
      return null
    }
    this.updateSetSize()

    // duration = Date.now - creation
    const entityTime = this.setTime[removed.id]
    entityTime.duration = scheduler.getTime() - entityTime.creation

    return removed
  }

  private updateSetSize() {
    this.setSize.push(this.set.length)
  }

  /**
   * isEmpty()
   * @returns Verifica se a fila está vazia
   */
  public isEmpty() {
    return this.set.length === 0
  }

  /**
   * isFull()
   * @returns Verifica se a fila está cheia
   */
  public isFull() {
    // zero não tem limite de tamaho
    if (this.maxPossibleSize === 0) {
      return false
    }

    return this.set.length === this.maxPossibleSize
  }

  /**
   * findEntity(id)
   * @returns Retorna referência para uma Entity, se esta estiver presente nesta EntitySet coleta de estatísticas
   */
  public findEntity(id: string): Entity | undefined {
    return this.set.find(entity => entity.id !== id)
  }

  // Coleta de estatísticas

  /**
   * averageSize()
   * @returns Retorna quantidade média de entidades no conjunto
   */
  public averageSize(): number {
    return this.setSize.reduce((a, b) => a + b, 0) / this.setSize.length
  }

  /**
   * getSize()
   * @returns Retorna quantidade de entidades presentes no conjunto no momento
   */
  public getSize(): number {
    return this.set.length
  }

  /**
   * getMaxPossibleSize()
   * @returns Retorna quantidade máxima da fila
   */
  public getMaxPossibleSize(): number {
    return this.maxPossibleSize
  }

  /**
   * setMaxPossibleSize()
   * @returns Define quantidade máxima da fila
   */
  public setMaxPossibleSize(size: number) {
    this.maxPossibleSize = size
  }

  private calculateDurations() {
    let total = 0
    let max = 0

    const timeValues = Object.values(this.setTime).filter(
      time => time.duration !== 0
    )

    for (const time of timeValues) {
      total += time.duration

      if (time.duration > max) {
        max = time.duration
      }
    }
    const mean = timeValues.length > 0 ? total / timeValues.length : 0
    return { mean, max }
  }

  /**
   * averageTimeInSet()
   * @returns Retorna tempo médio que as entidades permaneceram neste conjunto
   */
  public averageTimeInSet() {
    return this.calculateDurations().mean
  }

  /**
   * maxTimeInSet()
   * @returns Retorna tempo mais longo que uma entidade permaneceu neste conjunto
   */
  public maxTimeInSet() {
    return this.calculateDurations().max
  }

  /**
   * timeCallback()
   * @param time
   */
  public timeCallback(time: number) {
    if (this.isRunningLog && time - this.lastLogTime >= this.timeGap) {
      this.log.push({ time, size: this.set.length })
      this.lastLogTime = time
    }
  }

  /**
   * startLog(timeGap)
   * @param timeGap - período em segundos
   * @returns Dispara a coleta (log) do tamanho do conjunto;
   * Esta coleta é realizada a cada timeGap unidades de tempo
   */
  public startLog(timeGap: number): void {
    this.isRunningLog = true
    this.timeGap = timeGap
  }

  /**
   * stopLog()
   * @returns Para a coleta (log)
   */
  public stopLog(): void {
    this.isRunningLog = false
  }

  /**
   * getLog()
   * @returns retorna uma lista contendo o log deste Resource até o momento;
   * Cada elemento desta lista é um par <tempoAbsoluto, tamanhoConjunto>
   */
  public getLog(): Log[] {
    return this.log
  }
}
