# Phone probe

This prints the values the Android phone's `PrayerEngine` produces, using the same
`adhan-java` 1.2.1 library. It exists so the extension's Shia fixtures can be
reproduced without trusting the extension to check itself.

The phone keeps its main parameters at sunset and reads Jafari (4 degrees) and
Tehran (4.5 degrees) Maghrib from a second Isha-only pass with the Twilight Angle
rule. `AdhanProbe.java` does the same, so the extension can be checked against the
library the phone actually ships.

Needs Java 16 or newer. On a Mac with an older default, set `JAVA_HOME` first:
`export JAVA_HOME=$(/usr/libexec/java_home -v 21)`.

```bash
curl -L -o /tmp/adhan-1.2.1.jar \
  https://repo1.maven.org/maven2/com/batoulapps/adhan/adhan/1.2.1/adhan-1.2.1.jar
javac -cp /tmp/adhan-1.2.1.jar -d /tmp/adhan-probe tools/adhan-probe/AdhanProbe.java
java -cp /tmp/adhan-1.2.1.jar:/tmp/adhan-probe AdhanProbe
```

Expected output:

| Place | Sunrise | Sunset | Jafari Maghrib / Isha | Tehran Maghrib / Isha |
| --- | --- | --- | --- | --- |
| Oslo, 21 June | 03:54 | 22:44 | 23:05 / 23:56 | 23:07 / 23:56 |
| Trondheim, 21 June | 03:02 | 23:38 | 23:52 / 00:26 | 23:53 / 00:26 |
| Tampere, 21 June | 03:42 | 23:12 | 23:30 / 00:15 | 23:32 / 00:15 |
| Manchester, 21 June | 04:40 | 21:42 | 22:10 / 23:19 | 22:13 / 23:19 |
| Anchorage, 20 June | 04:20 | 23:43 | 00:01 / 00:47 | 00:03 / 00:47 |

The probe rounds with `CalendarUtil.roundedMinute`, the same rounding the phone's
`PrayerTimes` uses, so both products agree to the minute. When the sun reaches the
angle early the result is the true twilight; when it is slow or never reaches it,
the Twilight Angle rule caps it at sunset plus `angle / 60` of the night. Those
values are pinned in `tests/unit/engine.test.ts`. If they drift, the extension and
this probe have diverged. Do not adjust a fixture to make the extension pass
without checking this probe first.
