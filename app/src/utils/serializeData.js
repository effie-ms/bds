import { normalize } from 'normalizr';

export const serializeData = (result, schema) =>
    result && !Array.isArray(result)
        ? normalize(result.results, schema)
        : normalize(result, schema);
