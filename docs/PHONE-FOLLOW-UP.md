# Phone follow-up: the true Shia Maghrib angle

The extension is finished at `40be55b`. The phone still uses the old Twilight
Angle cap, so the two products now differ above about 52°N in summer. This note
is the handoff for the phone repo. Claude manages that repo; nothing here edits
it.

## What the phone does now

`core/src/main/java/com/sajdatime/core/PrayerEngine.kt` builds a second
`CalculationParameters(0.0, angle, OTHER)` and reads `.isha`. That is the
Twilight Angle cap: sunset plus `angle / 60` of the night. It is always earlier
than Isha, so it cannot collide with the order clamp, but on a summer day when
the sun really does reach 4° or 4.5° it returns a time up to about 45 minutes
early.

## What the phone should do

Use the true angle whenever the sun reaches it, strictly before Isha. Fall back
to the existing cap when the sun never reaches the angle, or when the true angle
would land in the same minute as Isha or later. The second condition is not
optional: near solar midnight in summer the true angle can land after the
method's Isha, and the clamp would otherwise move Isha onto Maghrib and show the
same minute twice. The extension hit exactly that bug at Tampere and fixed it in
`40be55b`.

`adhan-java` 1.2.1 has no `maghribAngle` field, but it does expose the two
classes the probe already uses:

```kotlin
import com.batoulapps.adhan.data.TimeComponents
import com.batoulapps.adhan.internal.SolarTime

private fun trueAngleMaghrib(
    coordinates: AdhanCoordinates,
    date: DateComponents,
    angle: Double,
): java.util.Date? {
    val value = SolarTime(date, coordinates).hourAngle(-angle, true)
    if (!value.isFinite()) return null
    return TimeComponents.fromDouble(value).dateComponents(date)
}
```

Then replace the `maghrib` block with something like:

```kotlin
val sunset = base.maghrib
val ishaMinute = instantOf(base.isha)
val maghrib = maghribAngleFor[method]?.let { angle ->
    val trueAngle = trueAngleMaghrib(adhanCoords, dateComponents, angle)
        ?.takeIf { it.toInstant().isAfter(sunset.toInstant()) }
        ?.takeIf { instantOf(it) < ishaMinute }
    trueAngle ?: AdhanPrayerTimes(
        adhanCoords,
        dateComponents,
        CalculationParameters(0.0, angle, AdhanMethod.OTHER).apply {
            madhab = AdhanMadhab.SHAFI
            highLatitudeRule = HIGH_LATITUDE_RULE
        },
    ).isha
} ?: sunset
```

`instantOf` already truncates to the minute, so `< ishaMinute` is the same
whole-minute rule the extension uses. Compare against `base.isha`, not the
Ramadan `+30` Isha. `sunset` is `base.maghrib` because the main parameters
carry no maghrib angle.

## Tests to add

Pin these in `PrayerEngineTest`, using the phone's normal `ZoneId` and
`instantOf` output:

| Place | Date | Method | Maghrib | Isha |
| --- | --- | --- | --- | --- |
| Oslo | 21 June 2026 | Jafari | 23:35 | 23:56 |
| Oslo | 21 June 2026 | Tehran | 23:46 | 23:56 |
| Trondheim | 21 June 2026 | Jafari | 23:52 | 00:26 |
| Trondheim | 21 June 2026 | Tehran | 23:53 | 00:26 |
| Tampere | 21 June 2026 | Jafari | 23:30 | 00:15 |
| Tampere | 21 June 2026 | Tehran | 23:32 | 00:15 |
| Anchorage | 20 June 2026 | Jafari | 00:01 | 00:47 |

The Isha column is the phone's Shia Isha. Keep the existing Isha fixtures if
they differ; the Maghrib is the value this change moves. The extension gives
Oslo 23:56, Trondheim 00:26 and Tampere 00:15. Add the sweep: for latitudes 55 to 66 in steps of 0.5, on 25 May,
21 June and 15 July, skip polar days, and assert Maghrib is strictly before
Isha. That catches the collision the extension fixed.

Also check Anchorage: the true angle is after midnight but still before Isha, so
it must be kept, not capped. If the phone clamps to Isha, the guard is too
strict.

## Evidence

`tools/adhan-probe/README.md` in the extension repo prints the true angle and
the current phone cap for Oslo and Trondheim, using the same adhan-java jar the
phone uses. The extension tests are in `tests/unit/engine.test.ts`. The decision
and the deliberate difference are in `docs/DECISIONS.md` D-002.

## What not to change

- Keep the existing polar projection, `isUsable`, Ramadan Isha `+30`, manual
  corrections last, and the minute truncation. This is one block inside
  `PrayerEngine.computeDay`.
- Do not add `maghribAngle` to the main parameters. It feeds `isUsable` and
  projects a normal Oslo summer to 45°, which is why the second pass exists.
- Do not change the Sunni Maghrib. It stays sunset.
