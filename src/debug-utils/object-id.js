const objectIdMap = new WeakMap();
let objectCount = 0;

export default function objectId(object){
  if (!objectIdMap.has(object)) objectIdMap.set(object, ++objectCount);
  return objectIdMap.get(object);
}
