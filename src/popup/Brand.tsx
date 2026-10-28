/**
 * The launcher mark and the word mark. Settings and the setup screens show the full brand
 * (mark plus "SajdaTime" in sentence case). The Times header shows only the 32 px mark, so
 * the date over the Hijri date and the town chip fit on one 380 px row (U4, PLAN.md section
 * 6.1 "logo (32 px)"). The mark is decorative, so the image carries an empty alt.
 */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <p class={compact ? 'brand brand-compact' : 'brand'}>
      <img class="brand-logo" src="/icons/icon-128.png" alt="" width={compact ? 32 : 48} height={compact ? 32 : 48} />
      {!compact && 'SajdaTime'}
    </p>
  );
}
