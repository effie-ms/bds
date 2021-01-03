import { createFetchAction, createFetchSaga } from '@thorgate/spa-entities';
import { takeLatestWithMatch } from '@thorgate/spa-view-manager';
import { resolvePattern } from 'tg-named-routes';
import SETTINGS from 'settings';
import api from 'services/api';

import { sensorFilePressureDataSchema } from 'schemas/files';

export const fetchSensorFilePressureData = createFetchAction(
    '@@sagas/files/TRIGGER_SENSOR_FILE_PRESSURE_FETCH_DATA',
);

// Create worker to fetch data
const fetchSensorFilePressureDataWorker = createFetchSaga({
    resource: api.files.pressureData,
    key: sensorFilePressureDataSchema.key,
    listSchema: [sensorFilePressureDataSchema],
    useDetails: true,
    timeoutMs: SETTINGS.LONG_SAGA_TIMEOUT,
    mutateQuery(match, _action) {
        // Filter the annotations list by the selected analysis
        return { sensor_file: match.params.fileId };
    },
});

// Usage with `@thorgate/spa-view-manager`
export const fetchSensorFilePressureDataInitialWorker = fetchSensorFilePressureDataWorker.asInitialWorker(
    ({ params }) =>
        fetchSensorFilePressureData({
            kwargs: { pk: params.fileId },
        }),
);

export default function* fetchSensorFilePressureDataWatcher() {
    yield takeLatestWithMatch(
        fetchSensorFilePressureData.getType(),
        resolvePattern('files:details'),
        fetchSensorFilePressureDataWorker,
    );
}
