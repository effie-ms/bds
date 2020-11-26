import io
import struct
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


@csrf_exempt
@require_http_methods(["GET", "POST"])
def read_sensor_data(request):
    def read_chunks(f, length):
        count = 0
        while True:
            count += 1
            f.read(2)  # \n\r
            data = f.read(length)
            if not len(data) == length:
                break
            yield data

    raw = io.BytesIO(request.body)
    fmt = "<HIffffffffffffffffffffffBBBB"
    results = [
        struct.unpack(fmt, chunk) for chunk in read_chunks(raw, struct.calcsize(fmt))
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

    # ms to s
    t0 = output_dict["Time [ms]"][0]
    output_dict["Time [s]"] = output_dict["Time [ms]"]
    del output_dict["Time [ms]"]

    for idx, t in enumerate(output_dict["Time [s]"]):
        output_dict["Time [s]"][idx] = (output_dict["Time [s]"][idx] - t0) / 1000

    return JsonResponse(output_dict)
