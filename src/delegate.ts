export default class Delegate<FunctType extends (...args: any) => any> {
  private innerFuncts: FunctType[] = [];
  public add = (funct: FunctType) => this.innerFuncts.push(funct);
  public callAll = (...args: Parameters<FunctType>) =>
    this.innerFuncts.forEach((f) => f(...args));
}
