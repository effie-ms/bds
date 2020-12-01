import { createFetchAction, createFetchSaga } from '@thorgate/spa-entities';
import { takeLatestWithMatch } from '@thorgate/spa-view-manager';
import { resolvePattern } from 'tg-named-routes';
import SETTINGS from 'settings';

import api from 'services/api';

import { sensorFileSchema } from 'schemas/files';

export const fetchSensorFiles = createFetchAction(
    '@@sagas/files/TRIGGER_SENSOR_FILES_FETCH',
);

// Create worker to fetch data
const fetchSensorFilesWorker = createFetchSaga({
    resource: api.files.list,
    key: sensorFileSchema.key,
    listSchema: [sensorFileSchema],
    timeoutMs: SETTINGS.LONG_SAGA_TIMEOUT,
});

// Usage with `@thorgate/spa-view-manager`
export const fetchSensorFilesInitialWorker = fetchSensorFilesWorker.asInitialWorker(
    ({ params }) =>
        fetchSensorFiles({
            query: { upload: params.uploadId },
        }),
);

export default function* fetchSensorFilesWatcher() {
    yield takeLatestWithMatch(
        fetchSensorFiles.getType(),
        resolvePattern('files:list'),
        fetchSensorFilesWorker,
    );
}
