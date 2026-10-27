# Phone probe

This prints the values the Android phone's `PrayerEngine` produces, using the same
`adhan-java` 1.2.1 library. It exists so the extension's Shia fixtures can be
reproduced without trusting the extension to check itself.

The phone keeps its main parameters at sunset and reads Jafari (4 degrees) and
Tehran (4.5 degrees) Maghrib from a second Isha-only pass with the Twilight Angle
rule. `AdhanProbe.java` does exactly that. It is a verification tool, not shipped
code, and nothing in `src/` imports it.

```bash
curl -L -o /tmp/adhan-1.2.1.jar \
  https://repo1.maven.org/maven2/com/batoulapps/adhan/adhan/1.2.1/adhan-1.2.1.jar
javac -cp /tmp/adhan-1.2.1.jar -d /tmp/adhan-probe tools/adhan-probe/AdhanProbe.java
java -cp /tmp/adhan-1.2.1.jar:/tmp/adhan-probe AdhanProbe
```

Expected on 21 June 2026, Europe/Oslo:

| Place | Sunrise | Sunset | Jafari Maghrib | Tehran Maghrib |
| --- | --- | --- | --- | --- |
| Oslo | 03:54 | 22:44 | 23:05 | 23:07 |
| Trondheim | 03:02 | 23:38 | 23:52 | 23:53 |

Those are the numbers pinned in `tests/unit/engine.test.ts`. If they drift, the
phone and the extension have diverged. Do not adjust a fixture to make the
extension pass without checking this probe first.
