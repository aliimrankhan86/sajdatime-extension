import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.HighLatitudeRule;
import com.batoulapps.adhan.Madhab;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * Prints the phone's prayer values for the cases the extension pins.
 *
 * <p>The phone's engine uses adhan-java 1.2.1. For Jafari and Tehran it keeps the
 * main parameters at sunset and reads Maghrib from a second Isha-only pass with the
 * Twilight Angle rule, which caps the result at sunset plus angle / 60 of the night.
 * This program does the same, so the extension fixtures can be checked against the
 * library the phone actually ships.
 */
public final class AdhanProbe {
  private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

  private record Case(String name, double latitude, double longitude, String zone, DateComponents date) {}

  public static void main(String[] args) {
    print(new Case("Oslo", 59.9139, 10.7522, "Europe/Oslo", new DateComponents(2026, 6, 21)));
    print(new Case("Trondheim", 63.4305, 10.3951, "Europe/Oslo", new DateComponents(2026, 6, 21)));
    print(new Case("Tampere", 61.4978, 23.761, "Europe/Helsinki", new DateComponents(2026, 6, 21)));
    print(new Case("Manchester", 53.48, -2.24, "Europe/London", new DateComponents(2026, 6, 21)));
    print(new Case("Anchorage", 61.2181, -149.9003, "America/Anchorage", new DateComponents(2026, 6, 20)));
  }

  private static void print(Case item) {
    Coordinates coordinates = new Coordinates(item.latitude(), item.longitude());
    ZoneId zone = ZoneId.of(item.zone());

    PrayerTimes jafari = prayerTimes(coordinates, item.date(), 16.0);
    PrayerTimes tehran = prayerTimes(coordinates, item.date(), 17.7);

    System.out.println(item.name());
    System.out.println("  sunrise " + format(jafari.sunrise, zone) + "  sunset " + format(jafari.maghrib, zone));
    System.out.println("  Jafari  maghrib " + format(shiaMaghrib(coordinates, item.date(), 4.0), zone)
        + "  isha " + format(jafari.isha, zone));
    System.out.println("  Tehran  maghrib " + format(shiaMaghrib(coordinates, item.date(), 4.5), zone)
        + "  isha " + format(tehran.isha, zone));
  }

  private static PrayerTimes prayerTimes(Coordinates coordinates, DateComponents date, double fajrAngle) {
    CalculationParameters parameters = new CalculationParameters(fajrAngle, 14.0, CalculationMethod.OTHER);
    parameters.madhab = Madhab.SHAFI;
    parameters.highLatitudeRule = HighLatitudeRule.TWILIGHT_ANGLE;
    return new PrayerTimes(coordinates, date, parameters);
  }

  private static Date shiaMaghrib(Coordinates coordinates, DateComponents date, double angle) {
    CalculationParameters parameters = new CalculationParameters(0.0, angle, CalculationMethod.OTHER);
    parameters.madhab = Madhab.SHAFI;
    parameters.highLatitudeRule = HighLatitudeRule.TWILIGHT_ANGLE;
    return new PrayerTimes(coordinates, date, parameters).isha;
  }

  private static String format(Date value, ZoneId zone) {
    return value.toInstant().atZone(zone).toLocalTime().format(TIME);
  }
}
