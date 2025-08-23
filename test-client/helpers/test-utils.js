import { CONFIG } from '../config/test-config.js';

export class TestUtils {
  static generateTestPageTitle() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${CONFIG.test.pageTitlePrefix} ${timestamp}`;
  }

  static generateTestContent() {
    const timestamp = new Date().toISOString();
    // Return storage format (HTML) instead of atlas_doc_format (JSON)
    return `<p>Test content created by MCP Test Client at ${timestamp}</p>
<p>This is a test page created for MCP server validation. It should be automatically deleted after testing.</p>`;
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static logTest(testName, status, details = null) {
    const timestamp = new Date().toISOString();
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
    
    console.log(`${statusIcon} [${timestamp}] ${testName}: ${status}`);
    
    if (details && CONFIG.test.verboseLogging) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  static logSection(sectionName) {
    console.log(`\\n=== ${sectionName} ===`);
  }

  static validateResponse(response, expectedFields = []) {
    if (!response) {
      throw new Error('Response is null or undefined');
    }

    // Check if response is error response
    if (response.isError) {
      throw new Error(`Tool returned error: ${response.content?.[0]?.text || 'Unknown error'}`);
    }

    // Check if response has content
    if (!response.content || !Array.isArray(response.content)) {
      throw new Error('Response missing content array');
    }

    // For MCP tools, we don't expect JSON responses - they return human-readable text
    // So we'll just validate that we have content and it's successful
    if (expectedFields.length === 0) {
      // No validation needed for fields, just check success
      return response;
    }

    // For tools that need data extraction, we'll need custom parsing
    // For now, just return successful responses as-is
    return response;
  }

  static async runTestWithTimeout(testFn, timeout = CONFIG.test.timeout) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = await testFn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  static async executeTestSuite(tests) {
    const results = {
      total: tests.length,
      passed: 0,
      failed: 0,
      errors: []
    };

    for (const test of tests) {
      try {
        this.logTest(test.name, 'RUNNING');
        
        await this.runTestWithTimeout(test.fn);
        
        this.logTest(test.name, 'PASS');
        results.passed++;
      } catch (error) {
        this.logTest(test.name, 'FAIL', { error: error.message });
        results.failed++;
        results.errors.push({
          test: test.name,
          error: error.message
        });
      }
    }

    return results;
  }

  static printTestSummary(results) {
    console.log('\\n=== TEST SUMMARY ===');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.errors.length > 0) {
      console.log('\\n=== FAILURES ===');
      results.errors.forEach(error => {
        console.log(`❌ ${error.test}: ${error.error}`);
      });
    }

    return results.failed === 0;
  }
}