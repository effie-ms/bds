import {
    createDetailSchemaSelector,
    createSchemaSelector,
} from '@thorgate/spa-entities';
import { schema } from 'normalizr';

export const sensorFileSchema = new schema.Entity('files');
export const sensorFileDataSchema = new schema.Entity('data');
export const sensorFilePressureDataSchema = new schema.Entity('pressureData');

export const selectSensorFiles = createSchemaSelector(sensorFileSchema);
export const selectSensorFile = createDetailSchemaSelector(sensorFileSchema);

export const selectSensorFileData = createDetailSchemaSelector(
    sensorFileDataSchema,
);
export const selectSensorFilePressureData = createDetailSchemaSelector(
    sensorFilePressureDataSchema,
);
