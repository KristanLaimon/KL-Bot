/**
 * Hash map with collision resolution by chaining
 */
export default class HashMapChaining<K, V>{
  private map = new Map<K, V[]>();

  get Length() {
    return this.map.size;
  }

  get RawInsideData(){
    return this.map;
  }

  add(key:K, value:V){
    if(!this.map.has(key)){
      this.map.set(key, [value]);
    }else{
      this.map.get(key)!.push(value);
    }
  }

  get(key:K){
    return this.map.get(key);
  }

  toArray(){
    // const toReturn:{key:K, value:V[]}[] = [];
    // this.map.forEach((value, key) => {
    //   toReturn.push({key, value});
    // })
    // return toReturn;
    return MapToArray(this.map);
  }

  clear(){
    this.map.clear();
  }

  printKey(key:K){
    this.map.forEach((value, key) => {
      console.log(`${key}: ${value.join(", ")}`);
    })
  }
}

export function MapToArray<K, V>(map: Map<K, V>): Array<{ key: K, value: V }> {
  const result: Array<{ key: K, value: V }> = [];
  map.forEach((value, key) => {
    if (value instanceof Map) {
      result.push(...MapToArray(value));
    } else {
      result.push({ key, value });
    }
  });
  return result;
}