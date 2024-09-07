import { EMOJI_REGEX, REGEX_EMOJI_GLOBAL } from '../../constants'
import { allIOSEmojis } from '../../emojiHelpers'

it('normal emojis', () => {
  expect('🧠 Big Brain'.match(EMOJI_REGEX)).toBeTruthy()
  expect('👾 X Æ A-Xii 👾'.match(EMOJI_REGEX)).toBeTruthy()
  expect('🚦'.match(EMOJI_REGEX)).toBeTruthy()
  expect('🖼️'.match(EMOJI_REGEX)).toBeTruthy()
})

it('all ios emojis', () => {
  allIOSEmojis.forEach(emoji => {
    expect(emoji.match(EMOJI_REGEX)).toBeTruthy()
  })
})

it('prevent unwanted characters to be detected as emojis.', () => {
  // previous emoji regex used in compareStringsWithEmoji detected string with apostrophe(’) as emoji
  // https://github.com/cybersemics/em/issues/952
  expect('1234567890*&^’%$#@!-+\\;'.match(REGEX_EMOJI_GLOBAL)).toBeFalsy()
})

it('ios/macOS emojis without variant selector', () => {
  // Note: All these IOS/macOS emojis unicode don't have \ufe0f at the end. So they are detected as text represenation instead of emoji. RGI based emoji regex (in emoji-regex) doesn't detect them as emojis. Even though ios and mac os don't quite follow the standards, they are still emojis and needs to be detected as one.

  const emojis = [
    '👁',
    '🗣',
    '⛑',
    '🕶',
    '🕸',
    '🕊',
    '🐿',
    '🌪',
    '🌤',
    '🌦',
    '⛈',
    '🌩',
    '🌨',
    '🌬',
    '🌫',
    '⛸',
    '⛷',
    '🎖',
    '🏵',
    '🎗',
    '🎟',
    '♟',
    '⛴',
    '🏟',
    '🏜',
    '🏗',
    '🛤',
    '🛣',
    '🏞',
    '🏙',
    '🖥',
    '🖨',
    '🖲',
    '🗜',
    '🎞',
    '🎙',
    '🎚',
    '🎛',
    '⏲',
    '🕯',
    '⚒🛠',
    '🛡',
    '🕳',
  ]

  emojis.forEach(emoji => {
    expect(emoji.match(EMOJI_REGEX)).toBeTruthy()
  })
})

// About ZWJ sequences https://blog.emojipedia.org/emoji-zwj-sequences-three-letters-many-possibilities/
it('ZWJ Sequenced emoji should be detected as single emoji', () => {
  // Note: Some emojis are built from sequences of other emoji unicodes. But they should be detected as a single emoji.
  const zwjSequencedEmojis = ['👩‍👩‍👧‍👦', '👩🏻‍🦱', '👩🏽‍🏫', '👩🏼‍❤️‍💋‍👩🏽', '👩‍👧‍👦', '👨‍👨‍👦', '🧖🏽‍♀️', '🧝🏽‍♀️', '🙍🏼‍♀️', '🙆🏽‍♂️', '🙇🏽‍♀️', '👨‍👧‍👦']

  zwjSequencedEmojis.forEach(emoji => {
    expect(emoji.match(REGEX_EMOJI_GLOBAL)).toHaveLength(1)
  })

  // All individual emoji should be detected as a single emoji.
  // TODO: Only this emoji 👁‍🗨 is detected as two separate emojis. Fix this later.
  allIOSEmojis
    .filter(emoji => !['👁‍🗨'].includes(emoji))
    .forEach(emoji => {
      expect(emoji.match(REGEX_EMOJI_GLOBAL)).toHaveLength(1)
    })
})

it('completely match individual emoji without leaving unmatched selectors like uFE0F', () => {
  allIOSEmojis
    .filter(emoji => !['👁‍🗨'].includes(emoji))
    .forEach(emoji => {
      const match = emoji.match(EMOJI_REGEX)
      expect(match).toBeTruthy()
      // Whole emoji should be matched without leaving unmatched unciode characters
      expect(match![0].length).toBe(emoji.length)
    })
})
