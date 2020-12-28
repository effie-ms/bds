import {
    createDetailSchemaSelector,
    createSchemaSelector,
} from '@thorgate/spa-entities';
import { schema } from 'normalizr';

export const annotationSchema = new schema.Entity('annotations');

export const selectAnnotations = createSchemaSelector(annotationSchema);
export const selectAnnotation = createDetailSchemaSelector(annotationSchema);
