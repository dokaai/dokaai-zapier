const {
  normalizeCustomerIds,
} = require('../../dist/features/target-audiences/transforms/customer-ids');

const z = {
  errors: {
    Error: class AppError extends Error {
      constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
      }
    },
  },
};

describe('target audience customer ID normalization', () => {
  it('supports Zapier list and comma-separated values, deduplicating in order', () => {
    expect(normalizeCustomerIds(z, [' a ', 'b,c', 'a', ''])).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('rejects empty input', () => {
    expect(() => normalizeCustomerIds(z, ' , ')).toThrow(
      'Provide at least one Customer ID.',
    );
  });

  it('rejects malformed objects', () => {
    expect(() => normalizeCustomerIds(z, [{ id: 'customer' }])).toThrow(
      'Customer IDs must be strings or a Zapier list of strings.',
    );
  });
});
