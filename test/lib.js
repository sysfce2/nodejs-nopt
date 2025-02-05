const t = require('tap')
const noptLib = require('../lib/nopt-lib.js')
const Stream = require('stream')

const logs = []
t.afterEach(() => {
  logs.length = 0
})
process.on('log', (...msg) => {
  logs.push(msg)
})

const nopt = (t, argv, opts, expected, expectedLogs) => {
  if (Array.isArray(argv)) {
    t.strictSame(noptLib.nopt(argv, { typeDefs: noptLib.typeDefs, ...opts }), expected)
  } else {
    noptLib.clean(argv, { typeDefs: noptLib.typeDefs, ...opts })
    t.match(argv, expected)
  }
  if (expectedLogs) {
    t.match(expectedLogs, logs)
  }
  t.end()
}

t.test('stream', t => {
  nopt(t, { x: new Stream.Readable() }, { types: { x: Stream } }, {})
})

t.test('no/missing options', t => {
  t.doesNotThrow(() => noptLib.nopt([]))
  t.doesNotThrow(() => noptLib.nopt([], {}))
  t.doesNotThrow(() => noptLib.clean({}))
  t.doesNotThrow(() => noptLib.clean({}, {}))
  t.doesNotThrow(() => noptLib.parse([]))
  t.doesNotThrow(() => noptLib.parse([], {}, [], {}))
  t.doesNotThrow(() => noptLib.validate({}))
  t.doesNotThrow(() => noptLib.validate({}, null, null, null, {}))
  t.doesNotThrow(() => noptLib.resolveShort(''))
  t.doesNotThrow(() => noptLib.resolveShort('', {}))
  t.doesNotThrow(() => noptLib.resolveShort('', {}, {}, {}))
  t.end()
})

t.test('key argv is ignored', (t) => {
  nopt(t, ['--argvv', '--argv'], {}, {
    argvv: true,
    argv: {
      remain: [],
      cooked: ['--argvv', '--argv'],
      original: ['--argvv', '--argv'],
    },
  })
})

t.test('boolean with null', (t) => {
  nopt(t, ['--boolNull', 'null', '--boolOnly', 'null'], {
    types: {
      boolNull: [Boolean, null],
      boolOnly: [Boolean],
    },
  }, {
    boolNull: false,
    boolOnly: true,
    argv: {
      remain: ['null'],
      cooked: ['--boolNull', 'null', '--boolOnly', 'null'],
      original: ['--boolNull', 'null', '--boolOnly', 'null'],
    },
  })
})

t.test('-- after non string type', (t) => {
  nopt(t, ['--x', '5', '--y', '--', '200'], {
    types: {
      x: Number,
      y: Number,
    },
  }, {
    x: 5,
    // XXX: getting coverage to 100 and this seems wrong
    // test matches current implementation for now
    y: 1,
    argv: {
      remain: ['200'],
      cooked: ['--x', '5', '--y', '--', '200'],
      original: ['--x', '5', '--y', '--', '200'],
    },
  })
})

t.test('nan', (t) => {
  nopt(t, ['--x', '5'], {
    types: {
      x: NaN,
    },
  }, {
    x: undefined,
    argv: {
      remain: [],
      cooked: ['--x', '5'],
      original: ['--x', '5'],
    },
  })
})

t.test('string/null', (t) => {
  nopt(t, ['--x', 'null', '--y', 'false', '--z', 'true'], {
    types: {
      x: Number,
      y: Number,
      z: Number,
    },
  }, {
    argv: {
      remain: [],
      cooked: ['--x', 'null', '--y', 'false', '--z', 'true'],
      original: ['--x', 'null', '--y', 'false', '--z', 'true'],
    },
  })
})

t.test('false invalid handler', (t) => {
  // this is only for coverage
  nopt(t, ['--x', 'null'], {
    types: {
      x: Number,
    },
    invalidHandler: false,
  }, {
    argv: {
      remain: [],
      cooked: ['--x', 'null'],
      original: ['--x', 'null'],
    },
  })
})

t.test('longhand abbreviation', (t) => {
  nopt(t, ['--lon', 'text'], {
    types: {
      long: String,
    },
  }, {
    long: 'text',
    argv: {
      remain: [],
      cooked: ['--lon', 'text'],
      original: ['--lon', 'text'],
    },
  }, [
    /* eslint-disable-next-line max-len */
    ['warn', 'Expanding "--lon" to "--long". This will stop working in the next major version of npm.'],
  ])
})

t.test('shorthand abbreviation', (t) => {
  nopt(t, ['--shor'], {
    types: {},
    shorthands: {
      short: '--shorthand',
    },
  }, {
    shorthand: true,
    argv: {
      remain: [],
      cooked: ['--shorthand'],
      original: ['--shor'],
    },
  }, [
    /* eslint-disable-next-line max-len */
    ['warn', 'Expanding "--shor" to "--short". This will stop working in the next major version of npm.'],
  ])
})

t.test('shorthands that is the same', (t) => {
  nopt(t, ['--sh'], {
    types: {},
    shorthands: {
      sh: '--sh',
    },
  }, {
    sh: true,
    argv: {
      remain: [],
      cooked: ['--sh'],
      original: ['--sh'],
    },
  })
})

t.test('unknown multiple', (t) => {
  nopt(t, ['--mult', '--mult', '--mult', 'extra'], {
    types: {},
  }, {
    mult: [true, true, true],
    argv: {
      remain: ['extra'],
      cooked: ['--mult', '--mult', '--mult', 'extra'],
      original: ['--mult', '--mult', '--mult', 'extra'],
    },
  }, [
    ['warn', '"extra" is being parsed as a normal command line argument.'],
  ])
})
