# About

## What this is

-   A library to be used on writing tests to prevent SEO regression
-   An extensible collection of customizable checkers for SEO
-   A simple crawler that can be used to sample a website

## What this isn't

-   GUI tool for SEO
-   SEO general purpose checker or hint provider
-   An in-depth crawler or exhaustive analyzer

## Who is expected to use it

-   Software engineers
-   Automation testers
-   SEO specialists with medium JS and RegExp experience

# Simple example

```javascript
const { statusCodeChecker } = require('@sector-labs/seo-slip').checkers;
const { crawlPath } = require('@sector-labs/seo-slip').crawler;

const statusCodeRules = {
    code: 200,
    exceptions: {
        '/': 301,
        '/agents/': 301,
        '/new-projects': 301,
        '/mybayut': 301,
    },
};
const checkers = [
    statusCodeChecker(statusCodeRules),
];

const fullPath = 'https://www.bayut.com';
const maxDepth = 2;
const crawlerVariables = {};
crawlPath(fullPath, maxDepth, crawlerVariables, checkers, (results) => {
    results.messages.forEach(message => console.log(message));
});
```

# Complex example

See how this library is used for a real website [here](https://github.com/SectorLabs/bayut-seo-slip)

# Documentation

See documentation [here](DOCUMENTATION.md)
