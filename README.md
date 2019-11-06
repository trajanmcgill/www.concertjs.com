# www.concertjs.com
- Web site for Concert.js, a Javascript component for easily animating and synchronizing in the browser.
- The web site is deployed here: [http://www.concertjs.com/](http://www.concertjs.com/)
- The GitHub project for Concert.js itself is here: [https://github.com/trajanmcgill/concert.js](https://github.com/trajanmcgill/concert.js)


## Table of Contents
***
- [Introduction](#introduction)
- [Bug Reports and Suggested Enhancements](#bug-reports-and-suggested-enhancements)
- [Contributing to This Web Site](#Contributing-to-this-web-site)
- [Authors](#authors)
- [Version History](#version-history)

## Introduction
***
### What is Concert.js?
Concert.js is a JavaScript component for easily defining sequences of changes to CSS styles, DOM objects, or anything else that can be manipulated with JavaScript, and playing these sequences or synchronizing them with media playback, user interaction, or your own components. In short, it animates things, and if you want, it will precisely synchronize those animations with other things.

### How do I get and use Concert.js?
Visit [http://www.concertjs.com/](http://www.concertjs.com/) for information on Concert.js itself. The project you are looking at right now is the code for the Concert.js web site.

## Bug Reports and Suggested Enhancements
***
- For bug reports and suggested enhancements to the www.concertjs.com web site, visit [https://github.com/trajanmcgill/www.concertjs.com/issues](https://github.com/trajanmcgill/www.concertjs.com/issues).
- For bug reports and suggested enhancements to Concert.js itself, go here: [https://github.com/trajanmcgill/concert.js/issues](https://github.com/trajanmcgill/concert.js/issues).

## Contributing to this web site
***
- Prerequisites
    - [git](https://git-scm.com/)
    - [npm](https://www.npmjs.com/)
- Setup
	1. First, fork this project and then `git clone` clone from GitHub:
	2. Next, to get all the dependencies, move inside the newly created project directory and run `npm install`.
- Folder structure:
	- `components` directory contains some third-party components included in the web site.
	- `design` directory has some design notes files.
    - `src` directory contains all the source code.
- Additional folders (not tracked by git):
	- An `assembly` directory is created when building as a place where intermediate files are deposited for use by the build process itself.
	- A `dist` directory is created by the build process, and contains the assembled web site ready for publication. Both a `Dev` directory and a `Prod` directory are created there. The two are identical except that the `Prod` version has minified versions of JavaScript and CSS files, whereas `Dev` has full versions to make debugging easier.
	- `node_modules` is created by npm, and contains tools used in the build process.
- Building:
    - This project is built using [Grunt](https://gruntjs.com/). Building Concert.js does not require installing any npm packages globally.
    - Move to the project directory and run:
	    ```
	    node node_modules/grunt-cli/bin/grunt
	    ```
	    This will kick off a [Grunt](https://gruntjs.com/) script that will:
	    1. Clean up prior build output files.
	    2. Assemble the full web site into the `dist` folder.
	
	    Further details about how the build process works are listed in `Gruntfile.js`.
- Understanding the code:

    www.concertjs.com is built into essentially a static web site, using a simple, custom templating language where commonly used page components are only defined in one place and are inserted into each individual page by the build process. `src/ConcertJSPage.template.html` contains the primary master layout for the site, and each other template generates content that fits within that layout. The main exception is the reference documentation portion of the site, which is built by jsdoc (presently the documentation pages are actually part of the Concert.js project and are included as a third-party component here).
- Running the site:

    Because all the dynamic portions of this site are generated at build time, rather than at run time, there is no need for anything other than a very simple HTTP server for running and testing the site. You can use any server you want, but here are a couple simple, quick (low-or-no-configuration) ones you can just run and point to a path to serve up:
	- On Linux: [http-server](https://www.npmjs.com/package/http-server)
	- On Windows: [IIS Express](https://www.microsoft.com/en-us/download/details.aspx?id=48264)
- Contributing changes:

    There is not presently a formal document describing contributions to this project. If you want to add functionality or fix bugs, please at least pay attention to the coding style that is evident in the existing source. Thanks.
## Authors
***
[Trajan McGill](https://github.com/trajanmcgill)

## Version History
***
See [releases page](https://github.com/trajanmcgill/www.concertjs.com/releases) for version notes and downloadable assets.
