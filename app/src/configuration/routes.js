import loadable from '@loadable/component';
import '@tg-resources/fetch-runtime';
import { buildUrlCache, resolvePath } from 'tg-named-routes';

import App from 'containers/AppShell';
import PageNotFound from 'views/PageNotFound';

import permissionCheck from 'sagas/auth/permissionCheckSaga';
import activateLanguage from 'sagas/user/activateLanguage';
// import fetchUserDetails from 'sagas/user/fetchUserDetails';

import fetchSensorFileWatcher, {
    fetchSensorFileInitialWorker,
} from 'sagas/sensors/fetchSensorFile';
import fetchSensorFilesWatcher, {
    fetchSensorFilesInitialWorker,
} from 'sagas/sensors/fetchSensorFiles';
import patchSensorFileWatcherSaga from 'sagas/sensors/patchSensorFile';

import createUploadWatcherSaga from 'sagas/uploads/createUploadSaga';
import fetchUploadsWatcher, {
    fetchUploadsInitialWorker,
} from 'sagas/uploads/fetchUploads';
import uploadRequestWatcherSaga, {
    resetFileUploads,
} from 'sagas/uploads/uploadFileSaga';
import fetchSensorFileDataWatcher from 'sagas/sensors/fetchSensorFileData';
import fetchSensorFilePressureDataWatcher from 'sagas/sensors/fetchSensorFilePressureData';

import addAnnotationWatcherSaga from 'sagas/annotations/addAnnotation';
import patchAnnotationWatcherSaga from 'sagas/annotations/patchAnnotation';
import deleteAnnotationWatcherSaga from 'sagas/annotations/deleteAnnotation';
import fetchAnnotationsWatcher, {
    fetchAnnotationsInitialWorker,
} from 'sagas/annotations/fetchAnnotations';

import { createAuthenticationRoutes } from './routes/authentication';

const Home = loadable(() => import('views/Home'));
const RestrictedView = loadable(() => import('views/RestrictedView'));

const SensorDataFileList = loadable(() =>
    import('views/sensors/SensorDataFileList'),
);
const SensorDataFile = loadable(() => import('views/sensors/SensorDataFile'));

const NotFoundRoute = {
    name: '404',
    path: '*',
    component: PageNotFound,
};

const routes = [
    {
        component: App,
        // initial: [fetchUserDetails],
        watcher: [activateLanguage],
        routes: [
            {
                path: '/',
                exact: true,
                name: 'landing',
                component: Home,
                initial: [resetFileUploads, fetchUploadsInitialWorker],
                watcher: [
                    createUploadWatcherSaga,
                    fetchUploadsWatcher,
                    uploadRequestWatcherSaga,
                ],
            },
            {
                path: '/restricted',
                exact: true,
                name: 'restricted',
                component: RestrictedView,
                initial: permissionCheck,
            },
            {
                path: '/uploads/:uploadId/files',
                exact: true,
                name: 'files:list',
                component: SensorDataFileList,
                initial: fetchSensorFilesInitialWorker,
                watcher: fetchSensorFilesWatcher,
            },
            {
                path: '/uploads/:uploadId/files/:fileId',
                exact: true,
                name: 'files:details',
                component: SensorDataFile,
                initial: [
                    fetchSensorFileInitialWorker,
                    fetchAnnotationsInitialWorker,
                    // fetchSensorFileDataInitialWorker,
                ],
                watcher: [
                    fetchSensorFileWatcher,
                    fetchSensorFileDataWatcher,
                    fetchSensorFilePressureDataWatcher,
                    addAnnotationWatcherSaga,
                    patchAnnotationWatcherSaga,
                    deleteAnnotationWatcherSaga,
                    fetchAnnotationsWatcher,
                    patchSensorFileWatcherSaga,
                ],
            },
            createAuthenticationRoutes(NotFoundRoute),
            NotFoundRoute,
        ],
    },
];

buildUrlCache(routes);

/**
 * Resolve url name to valid path.
 *   Also known as `resolveUrl` or `reverseUrl`.
 *
 * Providing query string can be done with object or string.
 * Caveat with string is that it should be formatted correctly e.g `foo=bar` or `foobar`
 *
 * @deprecated
 * @param name URL name
 * @param [kwargs=null] URL parameters
 * @param [query=null] URL query string
 * @param [state=null] URL state object to pass to next url
 * @returns URL matching name and kwargs
 */
export const urlResolve = resolvePath;

export default routes;
