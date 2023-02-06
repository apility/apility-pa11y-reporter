'use strict'

const fs = require('fs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

module.exports = function (options) {
  // initialize an empty report data
  const customReport = {
    results: {},
    errors: [],
    violations: {
      total: 0,
    },
  }

  const date = new Date()
  const dateString = [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
    [
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
      String(date.getSeconds()).padStart(2, '0'),
    ].join('.'),
  ].join('-')
  const fileName = options.fileName.replace('%s', dateString)

  let host = null

  return {
    // set host variable to sitemap host
    beforeAll() {
      if (argv && 'sitemap' in argv) {
        const url = new URL(argv.sitemap)
        host = url.host
      }
    },

    // add test results to the report
    results(results) {
      // skip if url is on a different domain than sitemap (most likely redirect to external site)
      if (host) {
        const url = new URL(results.pageUrl)
        if (url.host !== host) {
          console.log(`Skipped ${results.pageUrl}`)
          return
        }
      }

      customReport.results[results.pageUrl] = results
      customReport.violations.total += results.issues.length
      console.log(`Finished processing ${results.pageUrl}`)
    },

    // also store errors
    error(error, url) {
      const err = {error, url}
      customReport.errors.push(err)
      console.error(err)
    },

    // write to a file
    afterAll() {
      const data = JSON.stringify(customReport)
      return fs.promises.writeFile(fileName, data, 'utf8')
    }
  }
}
