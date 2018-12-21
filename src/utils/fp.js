import { reduce, assign } from 'lodash/fp';


// Return the "union" of a list of objects. "Union" here means assigning all
// properties of the objects to a single, initially empty, result object.
// If a property occurs in more than one object in the list, the last
// occurrence wins (as in `assign`).
export const objUnion = reduce((result, value) => assign(result, value), {});
