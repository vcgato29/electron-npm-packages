require('make-promises-safe')

const fs = require('fs')
const path = require('path')
const {compact, flatten} = require('lodash')
const packages = require('..')
const tally = require('count-array-values')
const gravatarUrl = require('gravatar-url')
const npmUser = require('npm-user')
const RateLimiter = require('limiter').RateLimiter
const limiter = new RateLimiter(2, 'second')

var handles = packages
  .filter(pkg => Array.isArray(pkg.owners))
  .map(pkg => pkg.owners.map(owner => owner.name))

handles = compact(flatten(handles))

const prolificUsers = tally(handles, 'handle', 'packages')
  .filter(user => user.packages > 1)
  .map(user => user.handle)

prolificUsers.forEach(handle => {
  limiter.removeTokens(1, function () {
    console.log(handle)
    npmUser(handle)
      .then(profile => {
        profile.gravatar = gravatarUrl(profile.email, {
          size: 200,
          default: 'https://cldup.com/FIjisumbxl.png'
        })
        fs.writeFileSync(
          path.join(__dirname, `../authors/${handle}.json`),
          JSON.stringify(profile, null, 2)
        )
      })
      .catch(err => {
        if (err.statusCode === 404) {
          console.error(handle, 'not found')
        } else {
          console.error(err)
        }
      })
  })
})
