export class Process {
  name: string
  id: string | null
  duration: () => number
  active: boolean

  constructor(name: string, duration: () => number) {
    this.id = null
    this.name = name
    this.duration = duration
    this.active = true
  }

  // Métodos

  /**
   * getId()
   * @returns ID do processo
   */
  public getId() {
    return this.id
  }

  /**
   * getDuration()
   * @returns Duração do processo
   */
  public getDuration() {
    return this.duration
  }

  /**
   * setId()
   * @param id - Id do process
   */
  public setId(id: string): void {
    this.id = id
  }

  /**
   * isActive()
   * @returns Status do processo, ativo ou não
   */
  public isActive(): boolean {
    return this.active
  }

  /**
   * activate(bool)
   * @returns seta o status do processo, ativo ou não
   */
  public setActive(active: boolean) {
    this.active = active
  }

  /**
   * canExecute()
   * @returns se o processo pode ser executado
   */
  public canExecute() {
    return true
  }

  /**
   * executeOnStart()
   * @returns faz antes de executar o processo
   */
  public executeOnStart() {}

  /**
   * executeOnEnd()
   * @returns faz depois de executar o processo
   */
  public executeOnEnd(): void {}
}
