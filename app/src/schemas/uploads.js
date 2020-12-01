import {
    createDetailSchemaSelector,
    createSchemaSelector,
} from '@thorgate/spa-entities';
import { schema } from 'normalizr';

export const uploadSchema = new schema.Entity('uploads');

export const selectUploads = createSchemaSelector(uploadSchema);
export const selectUpload = createDetailSchemaSelector(uploadSchema);
