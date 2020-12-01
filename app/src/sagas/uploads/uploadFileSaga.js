import { buffers, eventChannel, END } from 'redux-saga';
import { select, actionChannel, call, put, take } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { resolvePath as urlResolve } from 'tg-named-routes';
import Cookies from 'js-cookie';
import SETTINGS from 'settings';

import { setCreatedUploadId } from 'ducks/uploads';

import {
    SET_FILE_UPLOAD_REQUEST,
    selectors,
    setFileUploadFailure,
    setFileUploadProgress,
    setFileUploads,
    setFileUploadSuccess,
} from 'ducks/fileUpload';

export function createUploadFileChannel(endpoint, file, uploadId) {
    return eventChannel(emitter => {
        const xhr = new XMLHttpRequest();
        const onProgress = e => {
            if (e.lengthComputable) {
                const progress = e.loaded / e.total;
                emitter({ progress });
            }
        };
        const onFailure = () => {
            const { response, status } = xhr;
            if (status === 400 && response) {
                // showing error coming from server
                const responseObj = JSON.parse(response);
                const message = Object.values(responseObj).reduce(
                    ([acc, cur]) => `${acc} ${cur}`,
                );
                emitter({ err: message });
            } else {
                emitter({ err: 'Upload failed' });
            }
            emitter(END);
        };
        xhr.upload.addEventListener('progress', onProgress);
        xhr.upload.addEventListener('error', onFailure);
        xhr.upload.addEventListener('abort', onFailure);
        xhr.onreadystatechange = () => {
            const { readyState, status } = xhr;
            if (readyState === 4) {
                if (status === 201) {
                    emitter({ success: true });
                    emitter(END);
                } else {
                    onFailure();
                }
            }
        };
        xhr.open('POST', endpoint, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader(
            'X-CSRFToken',
            Cookies.get(SETTINGS.CSRF_COOKIE_NAME),
        );
        xhr.setRequestHeader('Accept', 'application/json');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('upload', uploadId);
        xhr.send(formData);
        return () => {
            xhr.upload.removeEventListener('progress', onProgress);
            xhr.upload.removeEventListener('error', onFailure);
            xhr.upload.removeEventListener('abort', onFailure);
            xhr.onreadystatechange = null;
            xhr.abort();
        };
    }, buffers.sliding(2));
}

// Upload the specified file
export function* uploadFileSaga(id, file, uploadId) {
    const channel = yield call(
        createUploadFileChannel,
        `${SETTINGS.BACKEND_SITE_URL}/api/files`,
        file,
        uploadId,
    );
    while (true) {
        const { progress = 0, err, success } = yield take(channel);
        if (err) {
            yield put(setFileUploadFailure(id, err));
            return;
        }
        if (success) {
            yield put(setFileUploadSuccess(id, file));
            return;
        }
        yield put(setFileUploadProgress(id, progress));
    }
}

export function* resetFileUploads() {
    yield put(setFileUploads({}));
}

// Watch for an upload request and then
// defer to another saga to perform the actual upload
export default function* uploadRequestWatcherSaga() {
    const buf = buffers.expanding();
    const requestChan = yield actionChannel(SET_FILE_UPLOAD_REQUEST, buf);
    while (true) {
        const action = yield take(requestChan);
        yield call(uploadFileSaga, action.id, action.file, action.uploadId);
        if (buf.isEmpty()) {
            const files = yield select(selectors.selectFiles);
            // if all file uploads are successful redirect to created session view
            if (!Object.values(files).find(u => u.error)) {
                yield put(setCreatedUploadId(null));
                yield put(setFileUploads({}));
                yield put(
                    push(
                        urlResolve('files:list', { uploadId: action.uploadId }),
                    ),
                );
            }
        }
    }
}
