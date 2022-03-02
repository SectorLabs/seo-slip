# Documentation

## Overview

The idea is to sample the site starting from the most important page or pages and run different checkers to look for issues.
The checkers are JS pieces of code customized with rules specific to a particular site described using JSON or YAML.

The checkers-rules separation enable scaling the tests for large and rich page types, multiple sites and multiple environments.

The under the hood crawler is used to download the discovered items starting from an initial URL and run the checkers.

The checkers, crawler and other tools of this library are meant to be flexible and be used with any test library.


## Crawler

### crawlPath

It is a wrapper around the [simple crawler](https://github.com/simplecrawler/simplecrawler).
By default, the crawler is set to download all the HTML, JS, CSS or image items linked from the `fullPath` item.
Then the crawler recursively scan the downloaded items, scans for new URLs and downloads the new discovered items up to `maxDepth` value.

For each downloaded item the crawler will run all the specified `checkers` and collect errors and debug information.

At the end the `done()` function is called and the results and the report passed to it.

| Param       | Type              | Description                                                                                                                                                                                                                                                                |
| ----------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fullPath`  | string            | The starting path                                                                                                                                                                                                                                                          |
| `maxDepth`  | number            | How many level to crawl starting from `fullPath`, where `maxDepth=1` means only the `fullPath` is downloaded and checked                                                                                                                                                   |
| `variables` | dictionary        | See [simple crawler documentation](https://github.com/simplecrawler/simplecrawler). Additionally a `skipUrls` array with regexps can be passed to skip the download and analyse of some URLs                                                                               |
| `checkers`  | array of checkers |                                                                                                                                                                                                                                                                            |
| `done`      | function          | Called on finished with `results`, `header` and `report` arguments. The `results` is a list of all the errors discovered by the checkers. The `report` is an CSV report with all the checkers' findings while the `header` is a list of the column names of the report     |

The `maxDepth` value must be small enough to prevent downloading too many pages or the entire website.


## Built-in checkers

The build-in checkers are part of the seo-slip library, but it's up to the test writer to use them or not.
The test writer has also the freedom to instantiate the checkers with any website specific rules.

In general this is how the checkers are instantiated:
```js
const { statusCodeChecker } = require('@sector-labs/seo-slip').checkers;
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
```
The `checkers` list can then be passed to the [crawlPath](#crawlpath)


### CanonicalChecker
This checker makes sure an HTML document is specifying in the header its canonical URL.
Example rules:
```json
[
    {
        "url": "(.*.site.com)/(..)/search/(.+)(\?.+)?",
        "expected": "($1)/($2)/search/($3)"
    },
    {
        "url": "(.*.site.com)/(..)/product-(\d+)(\?.+)?",
        "expected": "($1)/($2)/product-($3)"
    }
]
```
The checker is trying to match the URL of the document with a regexp specified in the `url`.
Note that the order of the regexps is important, the checker evaluates from the top and stops to the first match.

Before being compared, the expected URLs are processed by replacing all the `($number)` placeholders with the matched groups in the current URL.

For example, given the URL `https://www.site.com/en/product-9999?open_contact_form=true`, the second regexp expected to math the URLs of the product documents will match, and the captured groups are:
 - 0="https://www.site.com/en/product-9999?open_contact_form=true"
 - 1="en"
 - 2="https://www.site.com"
 - 3="9999"
 - 4="?open_contact_form=true"

After processing, the resulted expected canonical URL is:
 - "https://www.site.com/en/product-9999"

Note that, in our particular example, the expected URL of the product documents are omitting the query params on purpose.


### ContentChecker
This checker can be used to assert some things about the content of the HTML documents.
With the help of XPath and regexp, it can be used to make sure the crawled documents contain certain tags, elements, attributes or text.
Example rules:
```json
[
    {
        "url": "(.*.site.com)/(..)/search/(.+)(\?.+)?",
        "expected": {
            "//h1/text()": "^(.|\n){5,300}$",
            "//meta[@name=\"description\"]/@content": "^(.|\n){5,500}$'"
        }
    },
    {
        "url": "(.*.site.com)/(..)/product-(\d+)(\?.+)?",
        "expected": {
            "//h1/text()": "^(.|\n){5,300}$",
            "//title/text()": "^(.|\n){5,300}$",
            "//meta[@name=\"description\"]/@content": "^(.|\n){5,500}$'"
        }
    }
]
```
The checker is trying to match the URL of the document with a regexp specified in the `url`.
Note that the order of the regexps is important, the checker evaluates from the top and stops to the first match.

The checker is looking in the document for all the specified items specified in the `expected` as keys and matches the found values against the expected values.

For example, given the URL `https://www.site.com/en/product-9999?open_contact_form=true`, the second regexp expected to math the URLs of the product documents will match.
The checker will interrogate the DOM using [xpath-html](https://github.com/hieuvp/xpath-html) and expects all these elements:
1. `//h1/text()`
2. `//title/text()`
3. `//meta[@name=\"description\"]/@content`

to match the same `^(.|\n){5,300}$` expected regexp, which means each identified element to have at least 5 but no more than 300 characters.

In case of multiple matches for the same XPath expression (like `//h1/text()`) in the same document then the contents are concatenated and the result is matched against the expected regexp.

In this case, the capturing groups are used for logical separation and they are not used by this checker.
However, the same regexps might be reused in a way or another by other checkers like [CanonicalChecker](#CanonicalChecker) or [HreflangChecker](#HreflangChecker) that are using the groups to build the exact expected strings,
so for uniformity and maintainability sake, it is recommended all regexp expected to match the same URLs to be identical.


### DataSizeChecker
This checker can be used to ensure that a resource size is within reasonable limits.
Example rules:

```json
[
    {
        "condition": {
            "content-type": string,
            "path": string
        },
        "minDataSize": number,
        "maxDataSize": number,
        "minUncompressedDataSize": number,
        "maxUncompressedDataSize": number
    }
]
```


### HreflangChecker
This checker makes sure an HTML document is specifying in the header URLs to other HTML documents with the same content, but in different languages.
Example rules:
```json
[
    {
        "url": "(.*.site.com)/(..)/search/(.+)(\?.+)?",
        "expected": {
            "en": "($1)/en/search/($3)($4)",
            "ar": "($1)/ar/search/($3)($4)",
            "ro": "($1)/ro/search/($3)($4)"
        }
    },
    {
        "url": "(.*.site.com)/(..)/product-(\d+)(\?.+)?",
        "expected": {
            "en": "($1)/en/product-($3)($4)",
            "ro": "($1)/ro/product-($3)($4)"
        }
    }
]
```
The checker is trying to match the URL of the document with a regexp specified in the `url`.
Note that the order of the regexps is important, the checker evaluates from the top and stops to the first match.

The checker compares the hreflang information found in the header of the document with the one specified in the `expected` section:
 - The language list needs to match exactly (for example: `en`, `ar` and `ro` for the search documents, but only `en` and `ro` for the product documents).
 - The actual referred URLs needs to match exactly with the expected ones.
 - Before being compared, the expected URLs are processed by replacing all the `($number)` placeholders with the matched groups in the current URL.

For example, given the URL `https://www.site.com/en/product-9999?open_contact_form=true`, the second regexp expected to math the URLs of the product documents will match, and the captured groups are:
 - 0="https://www.site.com/en/product-9999?open_contact_form=true"
 - 1="https://www.site.com"
 - 2="en"
 - 3="9999"
 - 4="?open_contact_form=true"

After processing, the resulted expected hreflang URLs are:
 - en="https://www.site.com/en/product-9999?open_contact_form=true"
 - ro="https://www.site.com/ro/product-9999?open_contact_form=true"

Note that, in our particular example, the expected URLs of the product documents are omitting the query params on purpose.


### LoggerDummyChecker
It's a dummy checker, it can't find or report any errors.
It has no rules.
It is meant to add debug data to the report by adding these columns for each URL:
 - `url`
 - `__requestLatency`
 - `__downloadTime`
 - `__requestTime`
 - `__actualDataSize`


### MaxPageCountChecker
The rules of the MaxPageCountChecker is just a number.
```json
    number
```
This checker can be used to stop the crawl in case too many items were found.

### MetaRobotsChecker
The rules of the MetaRobotsChecker consists in an array of objects like this:
```json
[
    {
        "path": "regexp1",
        "index": boolean,
        "follow": boolean,
    },
    {
        "path": "regexp2",
        "index": boolean,
        "follow": boolean,
    },
    ...
]
```
Each HTML document path is tested against the regexps present in the rules in the given order: regexp1, regexp2, etc. until there is a match.
Then the `index` and `follow` of the HTML document are tested against the specified `index` and `follow` next to the matched regexp.
In case the document doesn't specify the `index` or `follow` then they both are considered `true`.
In case no regexp matches then no failure will be reported.

### RobotsTxtChecker
The rules of this checker are specifying a single user agent name and a list of paths that are not allowed:
```json
{
    "userAgent": "*",
    "notAllowed": [
        "path1",
        "path2",
        ...
    ],
}
```
In case any HTML path found during the crawl process is found in the `notAllowed` list,
but the robots.txt allows the `*` bot to crawl it then the path will be reported with an error.

The robots.txt is downloaded a single time when the crawl process is initiated.

The content of the robots.txt is parsed with [robots-parser](https://github.com/samclarke/robots-parser).

### SnapshotChecker
This checker compares the report of the current run with the report of the previous run.
It is up to the user to store and retrieve using its own custom mechanism the report from the previous run and pass to the checker along with the rules.
The rules:
```json
{
    "missingUrlCountThreshold": number,
    "ignoreColumns": [string],
    "ignoreUrls": [string]
}
```
The default value `missingUrlCountThreshold` of is 30. In case more than `missingUrlCountThreshold`% URLs from the previous report are not found in the new report then it's an error.

For each URL found in both the previous and the new report, the columns of the reports are compared as well.
In case a single column is different then it's an error.
The columns specified in `ignoreColumns` or prefixed with `__`, like `__downloadTime`, are skipped from the comparison.
The URLs specified in `ignoreUrls` are skipped from the comparison, however the total URL count includes these URLs as well.
 

### StatusCodeChecker
It checks that all paths have the expected HTTP status code.
Example rules:
```json
{
    "code": 200,
    "exceptions": {
        "/": 301,
        "/contact": [
            301,
            302
        ],
        "/product-\d*": {
            "regexp": true,
            "code": 301
        },
        "/item-\d*": {
            "regexp": true,
            "code": [301, 302]
        }
    }
}
```

The default value of the `code` is 200.
Ideally, all the crawlable URLs should be 200, however the checker allow specifying some exceptions as well.
Note that the keys of the exceptions are paths, not full URLs.
The crawler can be configured to check the subdomains or whitelist for crawling multiple domains, so a path can have more than one status code.


## Checker structure

In general a checker is a JS object initialized with rules passed on creation as a JSON.
The rules can be inline JSON, but for maximum flexibility and readability they could be loaded from a JSON or YAML file, this is up to the test writer.

Some general purpose checkers might have default built-in rules specific that are adequate for any site.

A checker can implement one or more of the following functions.
Excepting the constructor, these will be called by the crawler at different moments in time, for each downloaded item or before and after the entire crawl process.

### constructor

Usually the site specific SEO rules are passed to the checker when calling the constructor.
A general purpose checker might have the rules built in, or hard coded.
It is up to the user to instantiate the checker and pass it to the [crawlPath](#crawlPath).

| Param | Type   | Description                       |
| ----- | ------ | --------------------------------- |
| rules | object | SEO rules specific to the checker |

### init

Called a single time before starting any download.
It can be used to perform a one time only initialisation.
Doesn't take any argument and doesn't return anything.

### analysis

Called after an item was downloaded.

| Param          | Type                                                                                        | Description                                         |
| -------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `queueItem`    | [QueueItem](https://github.com/simplecrawler/simplecrawler/blob/master/README.md#QueueItem) | The queue item for which the request has completed  |
| `responseBody` | String                                                                                      | This will be the decoded HTTP response              |
| `response`     | [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)    | The http.IncomingMessage for the request's response |

**Returns**: A dictionary with the findings which will be passed to the [check](#check) and [report](#report) later on.

### check

Called after an item was analysed.

| Param    | Type   | Description                                  |
| -------- | ------ | -------------------------------------------- |
| analysis | object | The result returned by [analysis](#analysis) |

**Returns**: A dictionary containing a boolean and a list of errors:

```json
{
    "passed": boolean,
    "messages": [{"url": string, "source": string, "text":  string}]
}
```

### report

Called after an item was analysed. The crawler calls this for each item and concatenates the returned results into one large report.

| Param    | Type   | Description                                  |
| -------- | ------ | -------------------------------------------- |
| analysis | object | The result returned by [analysis](#analysis) |

**Returns**: A dictionary containing a set of serializable key value pairs that can be later used for debugging or saving a report to a file.

### shouldStop

Called before downloading an item.
It can be used as a safeguard to stop the crawler for example in case too many downloads happened.

| Param       | Type                                                                                        | Description                                            |
| ----------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `queueItem` | [QueueItem](https://github.com/simplecrawler/simplecrawler/blob/master/README.md#QueueItem) | The queue item for which the request is about to start |

### finalCheck

Called after all items were downloaded and analysed.
It can be used to perform global check after all the items were downloaded and analysed.

| Param    | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| analyses | object | The results returned by the [analysis](#analysis) calls   |
| report   | object | The entire report returned by the [report](#report) calls |

**Returns**: A dictionary containing a boolean and a list of errors similar to the object returned by [check](#check)

## CI

A collection of helpers that can be used to integrate the SEO tests in a CI.

## HTML

A collection of helpers that can be used to inspect or check the content of an HTML document.

## Reporting

Some helpers mostly used by the checkers to return results or reports in a consistent manner.
It also provides a `printResults()` helper that can be used print the results in a more human friendly way.
