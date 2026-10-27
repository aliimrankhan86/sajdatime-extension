/**
 * The launcher mark and the word mark. Every screen opens with it so the extension is
 * recognisable wherever the user lands: the first run, the Times popup, Settings and both
 * Location screens. The mark is decorative, so the image carries an empty alt and the name
 * is real text.
 */
export function Brand() {
  return (
    <p class="brand">
      <img class="brand-logo" src="/icons/icon-128.png" alt="" width="48" height="48" />
      SajdaTime
    </p>
  );
}
