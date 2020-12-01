import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Pagination } from '@thorgate/spa-pagination';
import { Link } from 'react-router-dom';
import { resolvePath as urlResolve } from 'tg-named-routes';

import { UploadShape, RouterLocationShape } from 'utils/types';

export const UploadList = ({ uploads, fetchUploads, location }) => {
    const fetchMore = useCallback(
        (payload, meta) =>
            fetchUploads(payload, { updateOrder: true, ...meta }),
        [location],
    );
    const hasUploads = uploads && uploads.length;

    return (
        <div className="mt-5">
            <h3>Latest uploads</h3>
            {hasUploads ? (
                <div className="mt-3 list-group">
                    {uploads.map(upload => (
                        <Link
                            key={upload.id}
                            to={urlResolve('files:list', {
                                uploadId: upload.id,
                            })}
                            className="list-group-item-action list-group-item btn-next"
                        >
                            {`${upload.name}_${upload.created_at}`}
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-muted mt-3">No uploads found.</p>
            )}
            <Pagination
                name="uploads"
                trigger={fetchMore}
                render={({ loadNext, hasNext }) =>
                    hasNext && (
                        <div className="row">
                            <button
                                type="button"
                                className="btn btn-secondary mx-auto load-more mb-3"
                                onClick={loadNext}
                            >
                                Load more
                            </button>
                        </div>
                    )
                }
            />
        </div>
    );
};

UploadList.propTypes = {
    uploads: PropTypes.arrayOf(UploadShape).isRequired,
    fetchUploads: PropTypes.func.isRequired,
    location: RouterLocationShape.isRequired,
};
