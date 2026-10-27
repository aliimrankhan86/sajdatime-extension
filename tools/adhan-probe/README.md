# Phone probe

This prints the values the Android phone's `PrayerEngine` produces, using the same
`adhan-java` 1.2.1 library. It exists so the extension's Shia fixtures can be
reproduced without trusting the extension to check itself.

The phone keeps its main parameters at sunset and reads Jafari (4 degrees) and
Tehran (4.5 degrees) Maghrib from a second Isha-only pass with the Twilight Angle
rule. `AdhanProbe.java` prints that capped value and, separately, the true angle
from `SolarTime`. The true angle is what the extension now uses whenever the sun
reaches it. The phone still caps in both cases, so the two products deliberately
differ until the phone makes the same change.

```bash
curl -L -o /tmp/adhan-1.2.1.jar \
  https://repo1.maven.org/maven2/com/batoulapps/adhan/adhan/1.2.1/adhan-1.2.1.jar
javac -cp /tmp/adhan-1.2.1.jar -d /tmp/adhan-probe tools/adhan-probe/AdhanProbe.java
java -cp /tmp/adhan-1.2.1.jar:/tmp/adhan-probe AdhanProbe
```

Expected on 21 June 2026, Europe/Oslo:

| Place | Sunrise | Sunset | True Jafari | True Tehran | Phone cap, Jafari / Tehran |
| --- | --- | --- | --- | --- | --- |
| Oslo | 03:54 | 22:44 | 23:35 | 23:45 | 23:05 / 23:07 |
| Trondheim | 03:02 | 23:38 | not reached | not reached | 23:52 / 23:53 |

The extension pins Oslo Jafari 23:35 and Tehran 23:46. Jafari matches the Java
probe. Tehran is one minute later because adhan-js and adhan-java round the last
seconds differently; D-004 records that difference. Trondheim never reaches
either angle, so both products fall back to the Twilight Angle cap and the
fixtures stay 23:52 and 23:53.

Those are the numbers pinned in `tests/unit/engine.test.ts`. If they drift, the
extension and this probe have diverged. Do not adjust a fixture to make the
extension pass without checking this probe first.
