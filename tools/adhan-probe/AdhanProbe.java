import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.HighLatitudeRule;
import com.batoulapps.adhan.Madhab;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;
import com.batoulapps.adhan.data.TimeComponents;
import com.batoulapps.adhan.internal.SolarTime;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * Prints the phone's prayer values for the cases the extension pins.
 *
 * <p>The phone's engine uses adhan-java 1.2.1. For Jafari and Tehran it keeps the
 * main parameters at sunset, then reads Maghrib from a second pass with the
 * Twilight Angle rule. This program does the same, so the extension fixtures can be
 * checked against the library the phone actually ships.
 */
public final class AdhanProbe {
  private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

  private record Case(String name, double latitude, double longitude, String zone, DateComponents date) {}

  public static void main(String[] args) {
    print(new Case("Oslo, Jafari", 59.9139, 10.7522, "Europe/Oslo", new DateComponents(2026, 6, 21)));
    print(new Case("Oslo, Tehran", 59.9139, 10.7522, "Europe/Oslo", new DateComponents(2026, 6, 21)));
    print(new Case("Trondheim, Jafari", 63.4305, 10.3951, "Europe/Oslo", new DateComponents(2026, 6, 21)));
    print(new Case("Trondheim, Tehran", 63.4305, 10.3951, "Europe/Oslo", new DateComponents(2026, 6, 21)));
  }

  private static void print(Case item) {
    Coordinates coordinates = new Coordinates(item.latitude(), item.longitude());
    PrayerTimes base = new PrayerTimes(coordinates, item.date(), CalculationMethod.MUSLIM_WORLD_LEAGUE.getParameters());
    ZoneId zone = ZoneId.of(item.zone());

    System.out.println(item.name());
    System.out.println("  sunrise " + format(base.sunrise, zone));
    System.out.println("  sunset  " + format(base.maghrib, zone));
    System.out.println("  true 4/4.5 " + text(trueAngle(coordinates, item.date(), 4.0), zone) + " (Jafari)");
    System.out.println("  true 4/4.5 " + text(trueAngle(coordinates, item.date(), 4.5), zone) + " (Tehran)");
    System.out.println("  phone cap " + format(shiaMaghrib(coordinates, item.date(), 4.0), zone) + " (Jafari)");
    System.out.println("  phone cap " + format(shiaMaghrib(coordinates, item.date(), 4.5), zone) + " (Tehran)");
  }

  private static Date trueAngle(Coordinates coordinates, DateComponents date, double angle) {
    SolarTime solar = new SolarTime(date, coordinates);
    double value = solar.hourAngle(-angle, true);
    if (Double.isNaN(value)) return null;
    return TimeComponents.fromDouble(value).dateComponents(date);
  }

  private static String text(Date value, ZoneId zone) {
    return value == null ? "not reached" : format(value, zone);
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
