import { useEffect, useState } from 'preact/hooks';
import { clockFormatter } from '../core/clock';
import { dateInZone } from '../core/engine';
import { offersTimetable, ramadanInfo } from '../core/hijri';
import { madhabLabel, slotLabel } from '../core/labels';
import { SLOTS, type CalculationPrefs, type RamadanInfo } from '../core/types';
import { methodName } from '../popup/meta';
import type { Settings } from '../settings/types';
import { localeTag, t } from '../i18n';
import {
  buildMonth,
  buildRamadan,
  clockNotes,
  dateSpanLabel,
  shortDate,
  stepMonth,
  type BuildInput,
  type DayRow,
} from './timetable';

/**
 * The printable timetable (PLAN.md section 6.5, "Save as PDF").
 *
 * A second extension page rather than a popup sheet, because the popup is 380 pixels
 * wide and a month of prayer times needs a sheet of paper. It is opened from the
 * popup footer with the month and the kind in the URL and nothing else: the place comes
 * from saved settings, so no coordinate is ever written into a URL or a tab title
 * (docs/SECURITY.md R5).
 */

export type TimetableKind = 'month' | 'ramadan';

export interface PrintProps {
  settings: Settings;
  /** YYYY-MM. The page starts here and moves on when the user asks. */
  initialMonth: string;
  initialKind: TimetableKind;
}

/** The month table's headings, read at render time so they follow the language. */
function monthHeaders(): string[] {
  return [t('print.date'), t('print.day'), t('print.hijri'), ...SLOTS.map((slot) => slotLabel(slot))];
}

// Ramadan renames two columns and puts the day of Ramadan first. The six times keep
// their order, so the same body cells serve both tables.
function ramadanHeaders(): string[] {
  return [
    t('print.ramadanDay'),
    t('print.date'),
    t('print.day'),
    t('slot.suhoor'),
    slotLabel('sunrise'),
    slotLabel('dhuhr'),
    slotLabel('asr'),
    t('slot.iftar'),
    slotLabel('isha'),
  ];
}

/** The exact wording of the line at the foot of the page, from PLAN.md section 6.5. */
function pageFooter(): string {
  return t('print.footer');
}

export function Print({ settings, initialMonth, initialKind }: PrintProps) {
  const [month, setMonth] = useState(initialMonth);
  const [kind, setKind] = useState<TimetableKind>(initialKind);

  // The same language the Times screen uses, which also decides 12 or 24 hour style.
  const locale = localeTag();
  const timeZone = settings.place.timeZone;
  const offset = settings.hijriOffsetDays;
  const prefs: CalculationPrefs = {
    method: settings.method,
    madhab: settings.madhab,
    timeZone,
    hijriOffsetDays: offset,
  };

  const today = dateInZone(new Date(), timeZone);
  const monthFirst = `${month}-01`;
  const monthRamadan = ramadanInfo(monthFirst, offset);
  const upcoming = ramadanInfo(today, offset);

  const input: BuildInput = {
    month,
    coordinates: { latitude: settings.place.latitude, longitude: settings.place.longitude },
    prefs,
    today,
    locale,
  };

  const table = buildMonth(input, monthRamadan);

  // The Ramadan table is offered when the shown month holds Ramadan days, or when
  // Ramadan begins within the next 30 days (the plan's own window), in which case it
  // shows that whole Ramadan, so the reader can print it before it starts.
  const ramadanForView: RamadanInfo | null =
    table.ramadanDays.length > 0
      ? monthRamadan
      : upcoming !== null && offersTimetable(upcoming, today)
        ? upcoming
        : null;
  const ramadanRows = ramadanForView ? buildRamadan(input, ramadanForView) : null;
  const canOfferRamadan = ramadanRows !== null && ramadanRows.length > 0;
  const viewing = kind === 'ramadan' && canOfferRamadan;
  const rows: DayRow[] = viewing && ramadanRows ? ramadanRows : table.days;

  const clock = clockFormatter(timeZone, locale);
  const todayRow = rows.find((row) => row.isToday);
  const notes = viewing
    ? clockNotes(
        rows.map((row) => row.date),
        timeZone,
        locale,
      )
    : table.clockNotes;
  const isPolar = rows.some((row) => row.isPolar);

  // The tab title becomes the file name when the page is saved as a PDF. It names the
  // month and never the town: docs/SECURITY.md R5 keeps the place out of page titles and
  // file names. The sheet itself says the town, because PLAN.md section 6.5 asks it to.
  useEffect(() => {
    document.title = viewing
      ? t('print.tabRamadan')
      : t('print.tabMonth', { title: table.title });
  }, [viewing, table.title]);

  const showRamadan = () => {
    setKind('ramadan');
  };
  const showMonth = () => {
    setKind('month');
  };

  return (
    <main class="print-page">
      <div class="print-bar">
        <button class="action" type="button" onClick={() => window.print()}>
          {t('print.printOrSave')}
        </button>
        {viewing ? (
          <button class="action action-small" type="button" onClick={showMonth}>
            {t('print.month')}
          </button>
        ) : (
          <>
            <button
              class="action action-small"
              type="button"
              onClick={() => setMonth(stepMonth(month, -1))}
            >
              {t('print.previous')}
            </button>
            <button
              class="action action-small"
              type="button"
              onClick={() => setMonth(stepMonth(month, 1))}
            >
              {t('print.next')}
            </button>
            {canOfferRamadan ? (
              <button class="action action-small" type="button" onClick={showRamadan}>
                {t('print.ramadan')}
              </button>
            ) : null}
          </>
        )}
      </div>

      <header class="print-head">
        <img class="print-logo" src="/icons/icon-128.png" alt="" width="56" height="56" />
        <div>
          <h1 class="print-title">
            {t(viewing ? 'print.ramadanTitle' : 'print.monthTitle', { town: settings.place.name })}
          </h1>
          {viewing && ramadanRows && ramadanForView ? (
            <p class="print-line">
              {dateSpanLabel(
                ramadanRows[0]?.date ?? '',
                ramadanRows[ramadanRows.length - 1]?.date ?? '',
                locale,
              )}{' '}
              · Ramadan {ramadanForView.hijriYear}
            </p>
          ) : (
            <p class="print-line">
              {table.title}
              {table.hijriLine ? ` · ${table.hijriLine}` : ''}
            </p>
          )}
          <p class="print-line">
            {methodName(settings.method)} · {t('settings.asrSchool')} {madhabLabel(settings.madhab)}
          </p>
        </div>
      </header>

      <table class="print-table">
        <caption class="sr-only">
          {t(viewing ? 'print.captionRamadan' : 'print.captionMonth', { town: settings.place.name, title: table.title })}
        </caption>
        <thead>
          <tr>
            {(viewing ? ramadanHeaders() : monthHeaders()).map((header) => (
              <th scope="col" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} data-date={row.date} class={row.isToday ? 'is-today' : undefined}>
              {viewing ? <td class="ramadan-day">{row.ramadanDay}</td> : null}
              <td>{viewing ? shortDate(row.date, locale) : row.day}</td>
              <td>{row.weekdayShort}</td>
              {viewing ? null : <td class="hijri">{row.hijri ?? ''}</td>}
              {SLOTS.map((slot) => (
                <td class="time" key={slot}>
                  <bdi>{clock.format(row.times[slot])}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {todayRow ? <p class="print-note">{t('print.today')}</p> : null}

      {isPolar ? (
        <p class="print-note">
          {t('times.polar')}
        </p>
      ) : null}

      {notes.map((note) => (
        <p class="print-note" key={note}>
          {note}
        </p>
      ))}

      <footer class="print-foot">{pageFooter()}</footer>
    </main>
  );
}
