import os
import struct
import uuid
from functools import wraps
from operator import itemgetter

from django.utils.decorators import available_attrs

import numpy as np
import pandas as pd
from scipy import signal


def random_path(instance, filename):
    """ Random path generator for uploads, specify this for upload_to= argument of FileFields
    """
    # Split the uuid into two parts so that we won't run into subdirectory count limits. First part has 3 hex chars,
    #  thus 4k possible values.
    uuid_hex = uuid.uuid4().hex
    return os.path.join(uuid_hex[:3], uuid_hex[3:], filename)


def path_prefix(prefix):
    def decorator(func):
        @wraps(func, assigned=available_attrs(func))
        def _wrapped_func(*args, **kwargs):
            return os.path.join(prefix, func(*args, **kwargs))

        return _wrapped_func

    return decorator


@path_prefix("files")
def random_files_path(instance, filename):
    return random_path(instance, filename)


def test_sensor_triplet(data_dict, sensor_keys, n=6, alpha=2.5):
    fL = 2 ** n

    w = signal.gaussian(fL, std=(fL - 1) / (2 * alpha))
    w = w / sum(w)
    wd = w[1:] - w[: len(w) - 1]

    if len(sensor_keys) < 3:
        return []

    X = data_dict[sensor_keys[0]]
    Y = data_dict[sensor_keys[1]]
    Z = data_dict[sensor_keys[2]]

    X = np.convolve(X, w, "same")
    Y = np.convolve(Y, w, "same")
    Z = np.convolve(Z, w, "same")

    Xfd = abs(np.convolve(X, wd, "same"))
    Yfd = abs(np.convolve(Y, wd, "same"))
    Zfd = abs(np.convolve(Z, wd, "same"))

    Xstd = pd.Series(Xfd).rolling(window=fL).std()
    Ystd = pd.Series(Yfd).rolling(window=fL).std()
    Zstd = pd.Series(Zfd).rolling(window=fL).std()

    delF = [np.sqrt(Xfd[i] ** 2 + Yfd[i] ** 2 + Zfd[i] ** 2) for i in range(len(Xfd))]
    delFsig = [
        (Xfd[i] * Xstd[i] + Yfd[i] * Ystd[i] + Zfd[i] * Zstd[i])
        / (np.sqrt(Xfd[i] ** 2 + Yfd[i] ** 2 + Zfd[i] ** 2))
        for i in range(len(Xfd))
    ]

    outliers = [1 if delF[i] < 3 * delFsig[i] else 0 for i in range(len(delF))]

    return outliers


def get_outliers(output_dict):
    n = 6
    outliers_p = test_sensor_triplet(
        output_dict, ["PL [hPa]", "PC [hPa]", "PR [hPa]"], n
    )
    outliers_a = test_sensor_triplet(
        output_dict, ["AX [m/s2]", "AY [m/s2]", "AZ [m/s2]"], n
    )
    outliers_m = test_sensor_triplet(
        output_dict, ["MX [microT]", "MY [microT]", "MZ [microT]"], n
    )
    outliers_r = test_sensor_triplet(
        output_dict, ["RX [rad/s]", "RY [rad/s]", "RZ [rad/s]"], n
    )
    outliers_e = test_sensor_triplet(
        output_dict, ["EX [deg]", "EY [deg]", "EZ [deg]"], n
    )

    severity_arr = np.add(
        np.add(np.add(np.add(outliers_p, outliers_a), outliers_m), outliers_r),
        outliers_e,
    )

    return [int(s) for s in severity_arr]


def get_sensor_data(
    filename, truncate_start=None, truncate_end=None, only_pressure=False
):
    def read_chunks(f, length):
        count = 0
        while True:
            count += 1
            f.read(2)  # \n\r
            data = f.read(length)
            if not len(data) == length:
                break
            yield data

    fmt = "<HIffffffffffffffffffffffBBBB"
    with open(filename, "rb") as raw:
        results = [
            struct.unpack(fmt, chunk)
            for chunk in read_chunks(raw, struct.calcsize(fmt))
        ]

    fieldnames = [
        "Fq",
        "Time [ms]",
        "PL [hPa]",
        "TL [C]",
        "PC [hPa]",
        "TC [C]",
        "PR [hPa]",
        "TR [C]",
        "EX [deg]",
        "EY [deg]",
        "EZ [deg]",
        "QW [-]",
        "QX [-]",
        "QY [-]",
        "QZ [-]",
        "MX [microT]",
        "MY [microT]",
        "MZ [microT]",
        "AX [m/s2]",
        "AY [m/s2]",
        "AZ [m/s2]",
        "RX [rad/s]",
        "RY [rad/s]",
        "RZ [rad/s]",
        "CSM",
        "CSA",
        "CSR",
        "CSTOT",
    ]

    output_dict = dict()
    for k in fieldnames:
        output_dict[k] = []

    for row in results:
        for idx, val in enumerate(list(row)):
            col = fieldnames[idx]
            output_dict[col].append(val)

    del output_dict["Fq"]
    del output_dict["TL [C]"]
    del output_dict["TC [C]"]
    del output_dict["TR [C]"]
    del output_dict["QW [-]"]
    del output_dict["QX [-]"]
    del output_dict["QY [-]"]
    del output_dict["QZ [-]"]
    del output_dict["CSM"]
    del output_dict["CSA"]
    del output_dict["CSR"]
    del output_dict["CSTOT"]

    # ms to s
    t0 = output_dict["Time [ms]"][0]
    output_dict["Time [s]"] = [(v - t0) / 1000 for v in output_dict["Time [ms]"]]

    del output_dict["Time [ms]"]

    if only_pressure:
        del output_dict["EX [deg]"]
        del output_dict["EY [deg]"]
        del output_dict["EZ [deg]"]

        del output_dict["RX [rad/s]"]
        del output_dict["RY [rad/s]"]
        del output_dict["RZ [rad/s]"]

        del output_dict["MX [microT]"]
        del output_dict["MY [microT]"]
        del output_dict["MZ [microT]"]

        del output_dict["AX [m/s2]"]
        del output_dict["AY [m/s2]"]
        del output_dict["AZ [m/s2]"]

    if truncate_start and truncate_end:
        truncated_idxs = [
            idx
            for idx, t in enumerate(output_dict["Time [s]"])
            if truncate_start <= t <= truncate_end
        ]

        for key in output_dict.keys():
            output_dict[key] = itemgetter(*truncated_idxs)(output_dict[key])

    if not only_pressure:
        n = len(output_dict["PL [hPa]"])
        output_dict["P [hPa]"] = [
            (
                output_dict["PL [hPa]"][idx]
                + output_dict["PC [hPa]"][idx]
                + output_dict["PR [hPa]"][idx]
            )
            / 3
            for idx in range(n)
        ]

        output_dict["severity"] = get_outliers(output_dict)

    return output_dict
