const ConsoleReporter = require('../../../lib/reporters/ConsoleReporter');

describe('ConsoleReporter', () => {
  let mockOut;

  beforeEach(() => {
    mockOut = jasmine.createSpyObj('out', ['write']);
  });

  describe('constructor', () => {
    it('sets its `out` property to `process.stdout` by default', () => {
      const reporter = new ConsoleReporter();
      expect(reporter.out).toBe(process.stdout);
    });

    it('sets its `out` property to the given argument', () => {
      const reporter = new ConsoleReporter(mockOut);
      expect(reporter.out).toBe(mockOut);
    });

    it('accepts options');
  });

  describe('instance methods', () => {
    function mockStack(directiveArgs = []) {
      return {
        getDirectiveArgs: jasmine.createSpy('getDirectiveArgs')
                            .and.returnValue(directiveArgs),
        snapshotAtLocation: jasmine.createSpy('snapshotAtLocation')
                              .and.callFake(() => mockStack()),
      };
    }

    const errors = [
      { rule: 'rule-a',
        message: 'This message has 30 characters',
        location: { line: 2, col: 20 },
      },
      { rule: 'rule-b',
        message: 'This has 17 chars',
        location: { line: 100, col: 5 },
      },
    ];

    let reporter, context;

    beforeEach(() => {
      spyOn(process, 'cwd').and.returnValue('/foo');
      reporter = new ConsoleReporter(mockOut);

      context = { filename: '/foo/bar/hello.html', stack: mockStack() };
    });

    describe('report', () => {
      beforeEach(() => {
        reporter = new ConsoleReporter(mockOut);
        spyOn(reporter, 'reportFile');
      });

      it('calls reportFile for each object in the given array', () => {
        const results = [
          { errors: Symbol('foo-errors'), context: { filename: 'foo.html' } },
          { errors: Symbol('bar-errors'), context: { filename: 'bar.html' } },
        ];

        reporter.report(results);

        for (const res of results) {
          expect(reporter.reportFile)
            .toHaveBeenCalledWith(res.errors, res.context);
        }
      });
    });

    describe('reportFile', () => {
      it('writes the relative file path', () => {
        reporter.reportFile(errors, context);
        expect(mockOut.write).toHaveBeenCalledWith('bar/hello.html\n');
      });

      it('writes the errors with the expected formatting', () => {
        reporter.reportFile(errors, context);

        [ '    2:20 This message has 30 characters rule-a\n',
          '  100:5  This has 17 chars              rule-b\n',
        ].forEach(output => {
          expect(mockOut.write).toHaveBeenCalledWith(output);
        });
      });

      describe('when a rule is disabled', () => {
        beforeEach(() => {
          context.stack.snapshotAtLocation
            .and.returnValue(mockStack(['rule-a']));
          reporter.reportFile(errors, context);
        });

        it('suppresses errors for the rule', () => {
          expect(mockOut.write).not.toHaveBeenCalledWith(
            jasmine.stringMatching(/rule-a/));
        });

        it('writes errors for other rules with the expected formatting', () => {
          expect(mockOut.write)
            .toHaveBeenCalledWith('  100:5 This has 17 chars rule-b\n');
        });
      });

      describe('when the color option', () => {
        const ESC = '\u001b';
        let reporter;

        describe('is not specified', () => {
          describe('and the output object has an isTTY option that is truthy', () => {
            beforeEach(() => {
              mockOut.isTTY = true;
              reporter = new ConsoleReporter(mockOut, {});
            });

            it('styles its output', () => {
              reporter.reportFile(errors, context);
              expect(mockOut.write)
                .toHaveBeenCalledWith(`${ESC}[4mbar/hello.html${ESC}[24m\n`);
            });
          });

          describe('and the output object has an iSTTY option that is falsy', () => {
            beforeEach(() => {
              delete mockOut.isTTY;
              reporter = new ConsoleReporter(mockOut, {});
            });

            it('does not style its output', () => {
              reporter.reportFile(errors, context);
              expect(mockOut.write).toHaveBeenCalledWith('bar/hello.html\n');
            });
          });
        });

        describe('is false', () => {
          beforeEach(() => {
            reporter = new ConsoleReporter(mockOut, { color: false });
          });

          it('does not style its output', () => {
            reporter.reportFile(errors, context);
            expect(mockOut.write).toHaveBeenCalledWith('bar/hello.html\n');
          });
        });

        describe('is true', () => {
          beforeEach(() => {
            reporter = new ConsoleReporter(mockOut, { color: true });
          });

          it('styles its output', () => {
            reporter.reportFile(errors, context);
            expect(mockOut.write)
              .toHaveBeenCalledWith(`${ESC}[4mbar/hello.html${ESC}[24m\n`);
          });
        });
      });
    });
  });
});
