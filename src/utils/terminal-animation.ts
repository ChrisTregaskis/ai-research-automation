/**
 * Displays a terminal loading animation using a sequence of characters.
 *
 * @param text - Optional text to display alongside the animation.
 * @param chars - An array of characters to use for the animation frames. Defaults to a set of spinner characters.
 * @param delay - The delay in milliseconds between animation frames. Defaults to 100ms.
 * @returns The interval ID which can be used to stop the animation with `clearInterval`.
 *
 * @example
 * const animation = loadingAnimation("Loading...");
 * To stop the animation later:
 * clearInterval(animation);
 */
export function loadingAnimation(
  text = '',
  chars = ['⠙', '⠘', '⠰', '⠴', '⠤', '⠦', '⠆', '⠃', '⠋', '⠉'],
  delay = 100
): NodeJS.Timeout {
  let x = 0;

  return setInterval(() => {
    process.stdout.write('\r' + chars[x++] + ' ' + text);
    x = x % chars.length;
  }, delay);
}

/**
 * Clears the current line in the terminal.
 * This is useful for overwriting the current line with new output.
 */
export function clearTerminalLine(): void {
  process.stdout.write('\r\x1b[K');
}
