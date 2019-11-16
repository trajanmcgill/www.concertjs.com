module.exports = function(grunt)
{
	function stripMinOrFull(dest, src)
	{
		var fullOriginalDest = dest + src,
			testExp = /(.*)(\.min|\.full)(\..+)/,
			testResult = testExp.exec(fullOriginalDest),
			outputFile = (testResult === null) ? fullOriginalDest : (testResult[1] + testResult[3]);

		console.log("copying " + fullOriginalDest + " to " + outputFile);

		return outputFile;
	} // end stripMinOrFull()

	let concertPkg = grunt.file.readJSON("node_modules\\concert.js\\package.json"); // get info about the included concert.js package

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

				checkSource: { expand: true, cwd: "src/", src: ["**/*.js", "!**/*.template.js"] }
			}, // end jshint task definitions


			jsdoc:
			{
				assemble:
				{
					src: ["node_modules/concert.js/dist/Concert.js"],
					options:
					{
						destination: "assembly/Reference/",
						template: "node_modules/jsdoc/templates/default"
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
						{ expand: true, cwd: "src/", src: ["**/*.html", "!TutorialExamples/**/*", "!Demos/**/*", "!**/*.template.html", "!**/*.templateData.html"], dest: "assembly/" },
						{ expand: true, cwd: "src/", src: ["**/*.js", "!TutorialExamples/**/*", "!Demos/**/*", "!**/*.template.js", "!**/*.templateData.js"], dest: "assembly/" },
						{ expand: true, cwd: "src/", src: ["**/*.css", "!TutorialExamples/**/*", "!Demos/**/*", "!**/*.template.css", "!**/*.templateData.css"], dest: "assembly/" }
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
						{ expand: true, cwd: "components/", src: "**/*", dest: "dist/Dev/components/" },
						{ expand: true, cwd: "node_modules/concert.js/dist/", src: "**/*", dest: "dist/Dev/components/Concert.js/" },

						{ expand: true, cwd: "components/", src: "**/*", dest: "dist/Prod/components/" },
						{ expand: true, cwd: "node_modules/concert.js/dist/", src: "**/*", dest: "dist/Prod/components/Concert.js/" }
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


			processTemplates:
			{
				assembleTemplateResults: { expand: true, cwd: "src", src: ["**/*.templateData.html", "**/*.templateData.css", "**/*.templateData.js"], dest: "assembly/" }
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
						{ expand: true, cwd: "components/requestAnimationFrame/", src: "**", dest: "/" }
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
						{ expand: true, cwd: "components/requestAnimationFrame/", src: "**", dest: "/" }
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
			"compress:zip", // build zip download archives
			"compress:tar", // build (intermediate) tar download archives
			"compress:gzip", // build gzip download archives
			"clean:removeIntermediateTarFiles", // remove all intermediate tar archives
			"jsdoc:assemble", // build reference documentation
			"copy:deployAssembledFiles", // copy all assembly files into dev and prod directories
			"copy:selectEnvironment",  // copy, in prod directory, *.min.js to *.js and *.min.css to *.css, and in dev directory, *.full.js to *.js and *.full.css to *.css
			"clean:removeFullAndMinFiles", // clean all .min.css, .min.js, .full.css, and .full.js files from dev and prod directories
			"copy:deployComponents", // copy components directory into dev and prod directories
			"copy:deployDemos", // copy demos directory into dev and prod directories
			"copy:deployTutorialExamples" // copy tutorial examples directory into dev and prod directories
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
-copy components directory into dev and prod directories
-copy tutorials directory into dev and prod directories
*/
