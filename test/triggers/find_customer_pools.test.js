const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);
// read the `.env` file into the environment, if available
zapier.tools.env.inject();

describe('triggers.find_customer_pools', () => {
  it('should run', async () => {
    const bundle = { inputData: {} };

    const results = await appTester(
      App.triggers['find_customer_pools'].operation.perform,
      bundle,
    );
    expect(results).toBeDefined();
    // TODO: add more assertions
  });
});
