import os
import struct
import uuid
from functools import wraps

from django.utils.decorators import available_attrs


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


def get_sensor_data(filename):
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

    short_output_dict = dict()
    for k, val in output_dict.items():
        if k != "Time [ms]":
            key = k
        else:
            key = "Time [s]"
        short_output_dict[key] = []

        i = 0
        step = 1000
        while i * step <= len(val):
            if i == 0:
                idx = 0
            else:
                idx = i * step - 1

            short_output_dict[key].append(val[idx])
            i += 1

    # ms to s
    t0 = short_output_dict["Time [s]"][0]
    short_output_dict["Time [s]"] = [
        (v - t0) / 1000 for v in short_output_dict["Time [s]"]
    ]

    n = len(short_output_dict["PL [hPa]"])
    short_output_dict["P [hPa]"] = [
        (
            short_output_dict["PL [hPa]"][idx]
            + short_output_dict["PC [hPa]"][idx]
            + short_output_dict["PR [hPa]"][idx]
        )
        / 3
        for idx in range(n)
    ]

    return short_output_dict
