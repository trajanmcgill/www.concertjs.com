module.exports = function(grunt)
{
	const concertPkg = grunt.file.readJSON("node_modules/concert.js/package.json"); // get info about the included concert.js package

	const buildNumberFile = "nextBuildNumber.txt";
	const cacheBusterVariableName = "build";
	const buildNumber = parseInt(grunt.file.read(buildNumberFile));
	grunt.file.write(buildNumberFile, buildNumber + 1); // Update the next build number


	function stripMinOrFull(dest, src)
	{
		var fullOriginalDest = dest + src,
			testExp = /(.*)(\.min|\.full)(\..+)/,
			testResult = testExp.exec(fullOriginalDest),
			outputFile = (testResult === null) ? fullOriginalDest : (testResult[1] + testResult[3]);

		console.log("copying " + fullOriginalDest + " to " + outputFile);

		return outputFile;
	} // end stripMinOrFull()


	function htmlTagWithBuildNumberURL(originalTag, originalUrl, cacheBusterVariableName, buildNumber)
	{
		/*
		if no server name
			add build number at end before named anchor (if there is one)
		else if concertjs.com server name
			working with section after server name and trailing slash,
			add build number at end before named anchor (if there is one)
		else
			don't add build number
		*/
		
		let concertjsServerUrlRegExp = /^(https?:\/\/(?:www.)?concertjs.com)($|((?:\/[^#\n\r\?]+)*\/)?(?:([^#\n\r\?]+)(\?[^#\n\r\?]*)?(#.*)?)$)/,
			finalUrl, finalTag;
		
		if(originalUrl.indexOf(":") < 0)
		{
			let namedAnchorPosition = originalUrl.indexOf("#"),
				existingArgumentsPosition = originalUrl.indexOf("?"),
				argumentsExist = (existingArgumentsPosition > -1),
				newArgString = (argumentsExist ? "&" : "?") + cacheBusterVariableName + "=" + buildNumber;

			if(namedAnchorPosition < 0)
				finalUrl = originalUrl + newArgString;
			else
				finalUrl = originalUrl.substring(0, namedAnchorPosition) + newArgString + originalUrl.substring(namedAnchorPosition);
			finalTag = originalTag.replace(originalUrl, finalUrl);
		}
		else
		{
			let concertjsServerUrlMatch = originalUrl.match(concertjsServerUrlRegExp);
			if(concertjsServerUrlMatch !== null)
			{
				let serverUrl = concertjsServerUrlMatch[1],
					filePath = (typeof(concertjsServerUrlMatch[3]) === "undefined" ? "" : concertjsServerUrlMatch[3]),
					fileNameOrFinalPathSegment = (typeof(concertjsServerUrlMatch[4]) === "undefined" ? "" : concertjsServerUrlMatch[4])
					argumentsExist = (typeof(concertjsServerUrlMatch[5]) !== "undefined"),
					existingArgumentString = (argumentsExist ? concertjsServerUrlMatch[5] : ""),
					namedAnchorString = (typeof(concertjsServerUrlMatch[6]) === "undefined" ? "" : concertjsServerUrlMatch[6]);

				finalUrl = serverUrl
					+ filePath
					+ fileNameOrFinalPathSegment
					+ existingArgumentString + (argumentsExist ? "&" : "?") + cacheBusterVariableName + "=" + buildNumber
					+ namedAnchorString;
				finalTag = originalTag.replace(originalUrl, finalUrl);
			}
			else
				finalTag = originalTag;
		}

		return finalTag;
	} // end htmlTagWithBuildNumberURL()


	// Project configuration.
	grunt.initConfig(
		{
			pkg: grunt.file.readJSON("package.json"),


			jshint:
			{
				options:
				{
					bitwise: true, browser: true, curly: false, eqeqeq: true, forin: true, immed: true, latedef: "nofunc", laxbreak: true, laxcomma: true, newcap: true,
					noarg: true, noempty: true, nonew: true, quotmark: "double", smarttabs: true, strict: true, trailing: true, undef: true, unused: true, validthis: true,
					globals: { "Concert": false }
				},

				checkSource: { expand: true, cwd: "src/", src: ["**/*.js", "!**/*.template.js", "!DocTemplates/**/*"] }
			}, // end jshint task definitions


			jsdoc:
			{
				assemble:
				{
					src: ["node_modules/concert.js/dist/Concert.js"],
					options:
					{
						destination: "assembly/Reference/",
						template: "src/DocTemplates/concertjs"
					}
				}
			}, // end jsdoc task definitions


			clean:
			{
				assembly: ["assembly/**/*"],

				www: ["dist/**/*"],

				removeAssembledOriginalJSandCSS:
				{
					src:
					[
						"assembly/**/*.js",
						"assembly/**/*.css",
						"!**/*.full.js",
						"!**/*.full.css"
					]
				},

				removeFullAndMinFiles:
				{
					src:
					[
						"dist/Dev/**/*.full.*",
						"dist/Dev/**/*.min.*",
						"dist/Prod/**/*.full.*",
						"dist/Prod/**/*.min.*"
					]
				},

				removeIntermediateTarFiles:
				{
					src: ["assembly/**/*.tar"]
				}
			}, // end clean task definitions


			copy:
			{
				assembleNonTemplatedSourceFiles:
				{
					files:
					[
						{
							expand: true,
							cwd: "src/",
							src:
							[
								"**/*",
								"!Demos/**/*",
								"!DocTemplates/**/*",
								"!TutorialExamples/**/*",
								"!**/*.template.html",
								"!**/*.template.js",
								"!**/*.template.css",
								"!**/*.templateData.html",
								"!**/*.templateData.js",
								"!**/*.templateData.css"
							],
							dest: "assembly/"
						}
					]
				},

				copyOriginalToFull:
				{
					files:
					[
						{ expand: true, cwd: "assembly/", src: ["**/*.js"], dest: "assembly/", ext: ".full.js" },
						{ expand: true, cwd: "assembly/", src: ["**/*.css"], dest: "assembly/", ext: ".full.css" },
					]
				},

				deployAssembledFiles:
				{
					files:
					[
						{ expand: true, cwd: "assembly/", src: "**/*", dest: "dist/Dev/" },
						{ expand: true, cwd: "assembly/", src: "**/*", dest: "dist/Prod/" }
					]
				},

				deployComponents:
				{
					files:
					[
						{ expand: true, cwd: "vendor/", src: "**/*", dest: "dist/Dev/Components/" },
						{ expand: true, cwd: "node_modules/@trajanmcgill/requestanimationframe/dist/", src: "**/*", dest: "dist/Dev/Components/requestAnimationFrame/" },
						{ expand: true, cwd: "node_modules/concert.js/dist/", src: "**/*", dest: "dist/Dev/Components/Concert.js/" },

						{ expand: true, cwd: "vendor/", src: "**/*", dest: "dist/Prod/Components/" },
						{ expand: true, cwd: "node_modules/@trajanmcgill/requestanimationframe/dist/", src: "**/*", dest: "dist/Prod/Components/requestAnimationFrame/" },
						{ expand: true, cwd: "node_modules/concert.js/dist/", src: "**/*", dest: "dist/Prod/Components/Concert.js/" }
					]
				},

				deployDemos:
				{
					files:
					[
						{ expand: true, cwd: "src/Demos/", src: "**/*", dest: "dist/Dev/Demos/" },
						{ expand: true, cwd: "src/Demos/", src: "**/*", dest: "dist/Prod/Demos/" }
					]
				},

				deployTutorialExamples:
				{
					files:
					[
						{ expand: true, cwd: "src/TutorialExamples/", src: "**/*", dest: "dist/Dev/TutorialExamples/" },
						{ expand: true, cwd: "src/TutorialExamples/", src: "**/*", dest: "dist/Prod/TutorialExamples/" }
					]
				},

				selectEnvironment: // ADD CODE HERE: probably need to exclude the reference docs from this process
				{
					files:
					[
						{ expand: true, cwd: "dist/Dev/", src: "**/*.full.css", dest: "dist/Dev/", rename: stripMinOrFull },
						{ expand: true, cwd: "dist/Dev/", src: "**/*.full.js", dest: "dist/Dev/", rename: stripMinOrFull },

						{ expand: true, cwd: "dist/Prod/", src: "**/*.min.css", dest: "dist/Prod/", rename: stripMinOrFull },
						{ expand: true, cwd: "dist/Prod/", src: "**/*.min.js", dest: "dist/Prod/", rename: stripMinOrFull }
					]
				}
			}, // end copy task defitions


			addBuildNumbers:
			{
				allOutputHTML: { expand: true, cwd: "dist", src: "**/*.html" }
			}, // end addBuildNumbers task definitions

			processTemplates:
			{
				assembleTemplateResults: { expand: true, cwd: "src", src: ["**/*.templateData.html", "**/*.templateData.css", "**/*.templateData.js", "!DocTemplates/**/*"], dest: "assembly/" }
			}, // end processTemplates task definitions


			cssmin:
			{
				minifyAssembledCSS: { expand: true, cwd: "assembly/", src: "**/*.full.css", dest: "assembly/", ext: ".min.css" }
			}, // end cssmin task definitions


			uglify:
			{
				options: { sequences: false, verbose: true, warnings: true },

				minifyAssembledJS: { options: { screwIE8: false }, expand: true, cwd: "assembly/", src: ["**/*.full.js"], dest: "assembly/", ext: ".min.js" },
				deminifyAssembledJS: { expand: true, options: { beautify: true }, cwd: "assembly/", src: ["*.min.js"], dest: "assembly/", ext: ".min.max.js" }
			}, // end uglify task definitions


			compress:
			{
				zip:
				{
					options:
					{
						archive: "assembly/Downloads/Concert.js-" + concertPkg.version + ".zip",
						mode: "zip"
					},
					files:
					[
						{ expand: true, cwd: "node_modules/concert.js/dist/", src: "**", dest: "/" },
						{ expand: true, cwd: "node_modules/@trajanmcgill/requestAnimationFrame/dist/", src: "**", dest: "/" },
						{ expand: true, cwd: "assembly/Reference/", src: "**", dest: "/Reference/" }
					]
				},

				tar:
				{
					options:
					{
						archive: "assembly/Downloads/Concert.js-" + concertPkg.version + ".tar",
						mode: "tar"
					},
					files:
					[
						{ expand: true, cwd: "node_modules/concert.js/dist/", src: "**", dest: "/" },
						{ expand: true, cwd: "node_modules/@trajanmcgill/requestAnimationFrame/dist/", src: "**", dest: "/" },
						{ expand: true, cwd: "assembly/Reference/", src: "**", dest: "/Reference/" }
					]
				},

				gzip:
				{
					options: { mode: "gzip" },
					files: [{ expand: true, cwd: "assembly/Downloads/", src: "**/*.tar", dest: "assembly/Downloads/", ext: ".tar.gz", extDot: "last" }]
				}
			} // end compress task definitions
		});
	
	
	// Load the plugins
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-jsdoc");
	

	// Define tasks
	grunt.registerMultiTask(
		"addBuildNumbers",
		"Update <a>, <script>, and <link> tags in all HTML output files to add a build number to the linked files, for cache-busting purposes",
		function()
		{
			const fileTargetExp = /<a\s+[^>]*href\s*=\s*"([^"#]+)[^"]*"[^>]*>|<link\s+[^>]*href\s*=\s*"([^"#]+)[^"]*"[^>]*>|<script\s+[^>]*src\s*=\s*"([^"#]+)[^"]*"[^>]*>/g;

			this.files.forEach(
				function (file)
				{
					let i, j, execResults, target, lastIndex, matchFound;

					for(i = 0; i < file.src.length; i++)
					{
						let curFileName = file.src[i],
							originalFileContents = grunt.file.read(curFileName),
							newFileContents;

						grunt.log.writeln("Examining file:" + curFileName);

						matchFound = false;
						newFileContents = originalFileContents.replace(
							fileTargetExp,
							(match, p1, p2, p3, offset, fullString) =>
								{
									let target = [p1, p2, p3].find(element => typeof(element) === "string"),
										matchReplacement = htmlTagWithBuildNumberURL(match, target, cacheBusterVariableName, buildNumber);
									matchFound = true;
									grunt.log.writeln("  found entry at position " + offset + ":" + match);
									grunt.log.writeln("    target=" + target);
									grunt.log.writeln("    replacement entry=" + matchReplacement);
									return matchReplacement;
								});

						if(matchFound)
							grunt.file.write(curFileName, newFileContents);
						else
							grunt.log.writeln("  No build numbers needed in this file.");
					}
				}) // end forEach loop over all files

				grunt.log.writeln("Processed " + this.files.length + " files. Current build number: " + buildNumber);
		}); // end call to grunt.registerMultiTask("addBuildNumbers"...)


	grunt.registerMultiTask(
		"processTemplates",
		"Build output from templates",
		function ()
		{
			this.files.forEach(
				function (file)
				{
					var i, j, curInputFileName, fileContents, outputBuffers = [], currentPos, nextOpenTagPos, nextCloseTagPos,
						curTargetFullName, templateContents, templateVarExp = /{{([^ \t\s\r\n]+?)}}/g, varMatch, targetOutput,
						openElementStack = [], allTargets = {}, fullTag, newElement, newText, nextTargetDefPos, finishedElement,
						curDestRootDir = file.dest.substr(0, file.dest.lastIndexOf("/")), curTarget, curSection, curSourceRootDir,
						templateExp = /\s+template="([^"]*)"/, sectionExp = /\s+section="([^"]*)"/, targetExp = /\s+target="([^"]*)"/,
						openTargetTagStart, openDataTagStart, closeDataTag, tagEnd;

					for (i = 0; i < file.src.length; i++)
					{
						curInputFileName = file.src[i];
						//grunt.log.writeln("Examining file: " + curInputFileName);
						if (/.*\.js$/i.test(curInputFileName) || /.*\.css$/i.test(curInputFileName))
						{
							//grunt.log.writeln("  js or css.");
							openTargetTagStart = "/*<template:targetDef";
							openDataTagStart = "/*<template:data";
							closeDataTag = "/*</template:data>*/";
							tagEnd = ">*/\r\n";
						}
						else if (/.*\.html$/i.test(curInputFileName))
						{
							//grunt.log.writeln("  html.");
							openTargetTagStart = "<template:targetDef";
							openDataTagStart = "<template:data";
							closeDataTag = "</template:data>";
							tagEnd = ">\r\n";
						}
						else
							grunt.fail.warn("processTemplates: unknown input file type (" + curInputFileName + ").");

						curSourceRootDir = curInputFileName.substr(0, curInputFileName.lastIndexOf("/"))
						//grunt.log.writeln("  curSourceRootDir=" + curSourceRootDir);
						fileContents = grunt.file.read(curInputFileName);
						//grunt.log.writeln("  File has been read.");
						//grunt.log.writeln("  File contents:" + fileContents)

						currentPos = 0;
						nextTargetDefPos = fileContents.indexOf(openTargetTagStart, currentPos);
						//grunt.log.writeln("  openTargetTagStart=" + openTargetTagStart + "; nextTargetDefPos=" + nextTargetDefPos);
						while (nextTargetDefPos >= 0)
						{
							fullTag = fileContents.substring(nextTargetDefPos, fileContents.indexOf(tagEnd, nextTargetDefPos) + tagEnd.length);
							allTargets[targetExp.exec(fullTag)[1]] = { templateFullName: curSourceRootDir + "/" + templateExp.exec(fullTag)[1], sections: [] };
							currentPos = nextTargetDefPos + fullTag.length;
							nextTargetDefPos = fileContents.indexOf(openTargetTagStart, currentPos)
							//grunt.log.writeln("  nextTargetDefPos=" + nextTargetDefPos);
						}

						currentPos = 0;
						nextOpenTagPos = fileContents.indexOf(openDataTagStart, currentPos);
						nextCloseTagPos = fileContents.indexOf(closeDataTag, currentPos);
						while (nextOpenTagPos >= 0 || nextCloseTagPos >= 0)
						{
							if (nextOpenTagPos < nextCloseTagPos && nextOpenTagPos >= 0)
								newText = fileContents.substring(currentPos, nextOpenTagPos);
							else
								newText = fileContents.substring(currentPos, nextCloseTagPos);
							for (j = 0; j < openElementStack.length; j++)
								openElementStack[j].output += newText;

							if (nextOpenTagPos < nextCloseTagPos && nextOpenTagPos >= 0)
							{
								fullTag = fileContents.substring(nextOpenTagPos, fileContents.indexOf(tagEnd, nextOpenTagPos) + tagEnd.length);
								currentPos = nextOpenTagPos + fullTag.length;

								newElement = { target: targetExp.exec(fullTag)[1], section: sectionExp.exec(fullTag)[1], output: "" };
								openElementStack.push(newElement);
							}
							else
							{
								fullTag = fileContents.substring(nextCloseTagPos, fileContents.indexOf(tagEnd, nextCloseTagPos) + tagEnd.length);
								currentPos = nextCloseTagPos + fullTag.length;

								finishedElement = openElementStack.pop();
								allTargets[finishedElement.target].sections[finishedElement.section] = finishedElement.output;
							}
							nextOpenTagPos = fileContents.indexOf(openDataTagStart, currentPos);
							nextCloseTagPos = fileContents.indexOf(closeDataTag, currentPos);
						} // end while (nextOpenTagPos >= 0 || nextCloseTagPos >= 0)

						grunt.log.writeln("");
					} // end for (i = 0; i < file.src.length; i++)

					for (curTarget in allTargets) if (allTargets.hasOwnProperty(curTarget))
					{
						curTargetFullName = curDestRootDir + "/" + curTarget;
						//grunt.log.writeln("curTargetFullName=" + curTargetFullName);

						templateContents = grunt.file.read(allTargets[curTarget].templateFullName);
						targetOutput =
							templateContents.replace(
								templateVarExp,
								function (match, p1)
								{
									if (typeof allTargets[curTarget].sections[p1] !== "string")
										grunt.fail.warn("No match found for template variable: " + p1);
									return allTargets[curTarget].sections[p1];
								});

						grunt.log.writeln("Writing target file: " + curTargetFullName);
						grunt.file.write(curTargetFullName, targetOutput);
					}
				});
		}); // end call to grunt.registerMultiTask("processTemplates"...)


	grunt.registerTask("lint_all", ["jshint:checkSource"]);

	grunt.registerTask("clean_all", ["clean:assembly", "clean:www"]);

	grunt.registerTask(
		"build_www",
		[
			"copy:assembleNonTemplatedSourceFiles", // copy non-templated source files into assembly directory, excluding demo and tutorial files
			"processTemplates:assembleTemplateResults", // process templates into assembly directory
			"copy:copyOriginalToFull", // copy all .js and .css files in assembly directory to *.full.js and *.full.css
			"clean:removeAssembledOriginalJSandCSS", // remove all original .js and css files from assembly directory
			"uglify:minifyAssembledJS", // minify all .full.js files in assembly directory into .min.js
			"cssmin:minifyAssembledCSS", // minify all .full.css files in assembly directory into .min.css
			"jsdoc:assemble", // build reference documentation
			"compress:zip", // build zip download archives
			"compress:tar", // build (intermediate) tar download archives
			"compress:gzip", // build gzip download archives
			"clean:removeIntermediateTarFiles", // remove all intermediate tar archives
			"copy:deployAssembledFiles", // copy all assembly files into dev and prod directories
			"copy:selectEnvironment",  // copy, in prod directory, *.min.js to *.js and *.min.css to *.css, and in dev directory, *.full.js to *.js and *.full.css to *.css
			"clean:removeFullAndMinFiles", // clean all .min.css, .min.js, .full.css, and .full.js files from dev and prod directories
			"copy:deployComponents", // copy external components into dev and prod directories
			"copy:deployDemos", // copy demos directory into dev and prod directories
			"copy:deployTutorialExamples", // copy tutorial examples directory into dev and prod directories
			"addBuildNumbers:allOutputHTML" // add a build number url parameter to all src and href parameters in all the finished html files, for browser cache-busting purposes
		]);

	grunt.registerTask("build_all", ["build_www"]);

	grunt.registerTask("rebuild_all", ["clean_all", "build_all"]);

	grunt.registerTask("default", ["lint_all", "rebuild_all"]);
};

/*
-clean build directories
-copy non-templated source files into assembly directory, excluding tutorial files
-process templates into assembly directory
-copy all .css files in assembly directory to *.full.css and all .js files in assembly directory to *.full.js
-remove all original .js and css files from assembly directory
-minify all .full.js files in assembly directory into .min.js
-minify all .full.css files in assembly directory into .min.css
-copy all assembly files into dev and prod directories
-copy, in prod directory, *.min.js to *.js and *.min.css to *.css, and in dev directory, *.full.js to *.js and *.full.css to *.css
-clean all .min.css, .min.js, .full.css, and .full.js files from dev and prod directories
-copy external components into dev and prod directories
-copy tutorials directory into dev and prod directories
*/
