import { call, takeLatest } from 'redux-saga/effects';
import { saveResult } from '@thorgate/spa-entities';
import api from 'services/api';
import { sensorFileSchema } from 'schemas/files';

export const TRIGGER_PATCH_SENSOR_FILE = '@@sagas/sensors/TRIGGER_PATCH';
export const patchSensorFile = (pk, data) => ({
    type: TRIGGER_PATCH_SENSOR_FILE,
    pk,
    data,
});

function* patchSensorFileSaga(payload) {
    try {
        const response = yield api.files.detail.patch(
            { pk: payload.pk },
            payload.data,
        );
        yield call(
            saveResult,
            sensorFileSchema.key,
            response,
            sensorFileSchema,
        );
    } catch (err) {
        console.error(err);
    }
}

export default function* patchSensorFileWatcherSaga() {
    yield takeLatest(TRIGGER_PATCH_SENSOR_FILE, patchSensorFileSaga);
}
