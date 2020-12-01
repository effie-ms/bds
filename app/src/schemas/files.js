import {
    createDetailSchemaSelector,
    createSchemaSelector,
} from '@thorgate/spa-entities';
import { schema } from 'normalizr';

export const sensorFileSchema = new schema.Entity('files');

export const selectSensorFiles = createSchemaSelector(sensorFileSchema);
export const selectSensorFile = createDetailSchemaSelector(sensorFileSchema);
